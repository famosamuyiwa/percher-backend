import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { Repository } from 'typeorm';
import { Request } from 'express';
import {
  CreatePaymentDTO,
  IPaymentInitResponse,
  PaymentInitDTO,
  PaystackInit,
} from './dto/payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'rdbms/entities/Payment.entity';
import {
  BookingStatus,
  PaymentStatus,
  PaymentType,
  QUEUE_NAME,
  ResponseStatus,
  TransactionMode,
  TransactionStatus,
  TransactionType,
} from 'enums';
import { getEnvVariable, handleError } from 'utils/helper-methods';
import { Booking } from 'rdbms/entities/Booking.entity';
import { Filter, IPersist } from 'interfaces';
import { User } from 'rdbms/entities/User.entity';
import { Wallet } from 'rdbms/entities/Wallet.entity';
import { Transaction } from 'rdbms/entities/Transaction.entity';
import { RabbitMQSingleton } from '../rabbitmq/rabbitmq.singleton';
import { NotificationType, NotificationStatus } from 'enums';
import { INotification } from 'interfaces';
import { PaymentQueueService } from './payment-queue.service';

@Injectable()
export class PaymentService {
  private readonly PAYSTACK_SECRET_KEY: string = getEnvVariable(
    'PAYSTACK_SECRET_KEY',
  );
  private readonly PAYSTACK_WEBHOOK_CALLBACK_URL: string = getEnvVariable(
    'PAYSTACK_WEBHOOK_CALLBACK_URL',
  );
  private readonly PAYSTACK_API_BASE_URL: string = getEnvVariable(
    'PAYSTACK_API_BASE_URL',
  );

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @Inject('RABBITMQ_SINGLETON')
    private readonly rabbitMQ: RabbitMQSingleton,
    @Inject(forwardRef(() => PaymentQueueService))
    private readonly paymentQueueService: PaymentQueueService,
  ) {}
  async initPayment(input: PaymentInitDTO) {
    try {
      const response = await this.paystackApiAxiosClient<
        IPaymentInitResponse,
        PaystackInit
      >('post', 'transaction/initialize', {
        ...input,
        amount: input.amount * 100,
        callback_url: this.PAYSTACK_WEBHOOK_CALLBACK_URL,
      });

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Payment initialized successfully',
        data: response.data.authorization_url,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async verifyPayment(reference: string) {
    try {
      const existingRef = await this.paymentRepository.findOne({
        where: { reference },
        relations: ['invoice', 'invoice.booking', 'wallet'],
      });

      if (existingRef && existingRef.status !== PaymentStatus.PENDING) {
        return {
          code: HttpStatus.OK,
          status: ResponseStatus.SUCCESS,
          message: 'Payment already verified',
          data: existingRef,
        };
      }

      const message = {
        type: 'VERIFY_PAYMENT',
        reference,
      };
      // Queue the payment verification
      await this.rabbitMQ.pushToQueue(QUEUE_NAME.PAYMENT, message);

      // Return immediate response
      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Payment verification queued',
        data: existingRef || { reference, status: PaymentStatus.PENDING },
      };
    } catch (err) {
      handleError(err);
    }
  }

  async verifyWebhook(input: Request) {
    try {
      const event = input.body;

      if (event.event === 'charge.success') {
        console.log('Charge Success');
        await this.verifyPayment(event.data.reference);
      }

      return {
        message: 'Webhook verified successfully',
      };
    } catch (err) {
      handleError(err);
    }
  }

  async paystackApiAxiosClient<ResponseT, RequestT>(
    method: 'post' | 'get',
    route: string,
    payload?: RequestT,
  ): Promise<ResponseT> {
    const CONFIG = {
      baseURL: this.PAYSTACK_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    // Correct the Axios call structure
    const call =
      method === 'get'
        ? this.httpService.get(route, CONFIG) // GET requests: config as second arg
        : this.httpService.post(route, payload, CONFIG); // POST requests: payload first, config third

    const response = call.pipe(
      map((result) => {
        if (!result.data) {
          throw new BadRequestException(
            'Something went wrong with this request',
          );
        }
        return result.data;
      }),
      catchError(async (error: AxiosError<Error>) => {
        const responseMessage =
          error?.response?.data?.message ??
          error?.response?.statusText ??
          error.message ??
          'Temporary server error, please try again later';
        const responseStatus = error?.response?.status ?? 500;

        throw new HttpException(responseMessage, responseStatus, {
          cause: new Error(responseMessage),
        });
      }),
    );

    return await lastValueFrom(response);
  }

  async getPayments() {
    try {
      const payments = await this.paymentRepository.find();
      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Payments retrieved successfully',
        data: payments,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async findAll(filter: Filter, userId: number, cursor?: number) {
    const { limit } = filter;

    try {
      const queryBuilder = this.paymentRepository
        .createQueryBuilder('payment')
        .andWhere('payment.status != :paymentStatus', {
          paymentStatus: PaymentStatus.PENDING,
        })
        .orderBy('payment.id', 'DESC')
        .take(limit);

      // Apply cursor condition if provided
      if (cursor) {
        queryBuilder.andWhere('payment.id < :cursor', { cursor });
      }

      const payments = await queryBuilder.getMany();

      // Get the next cursor (last record's ID)
      const nextCursor = payments.length
        ? payments[payments.length - 1].id
        : null;

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Payments retrieved successfully',
        data: payments,
        nextCursor, // Return nextCursor for the next batch
      };
    } catch (err) {
      handleError(err);
    }
  }

  async createPayment(
    reference: string,
    createPaymentDTO: CreatePaymentDTO,
    userId: number,
  ) {
    const { amount, transactionType } = createPaymentDTO;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const payment = this.paymentRepository.create({
      reference,
      type: PaymentType.DRAFT,
      wallet: user.wallet,
      amount,
      transactionType: transactionType,
    });

    await this.paymentRepository.save(payment);

    return {
      code: HttpStatus.OK,
      status: ResponseStatus.SUCCESS,
      message: 'Draft payment created successfully',
      data: payment,
    };
  }
  catch(err) {
    handleError(err);
  }

  async updateWalletBalance(
    walletId: number,
    amount: number,
  ): Promise<IPersist<Wallet | null>> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { id: walletId },
      });

      if (!wallet) {
        return {
          isPersist: false,
          msg: 'Wallet not found',
          payload: null,
        };
      }

      const updatedWallet = await this.walletRepository.update(walletId, {
        balance: Number(wallet.balance) + Number(amount),
      });

      if (!updatedWallet) {
        return {
          isPersist: false,
          msg: 'Wallet update failed',
          payload: null,
        };
      }

      const persistedWallet = await this.walletRepository.findOne({
        where: { id: walletId },
      });

      return {
        isPersist: true,
        msg: 'Wallet updated successfully',
        payload: persistedWallet,
      };
    } catch (err) {
      return {
        isPersist: false,
        msg: err.message,
        payload: null,
      };
    }
  }

  async persistTransaction(
    type: TransactionType,
    amount: number,
    walletId: number,
    paymentId: number,
  ): Promise<IPersist<Transaction | null>> {
    let persist;
    try {
      switch (type) {
        case TransactionType.DEPOSIT:
          persist = await this.depositTransaction(amount, walletId, paymentId);
          break;
        case TransactionType.WITHDRAWAL:
          break;
        case TransactionType.BOOKING:
          persist = await this.bookingTransaction(amount, walletId, paymentId);
          break;
        default:
          throw new BadRequestException('Invalid transaction type');
      }

      if (!persist?.isPersist) {
        throw new BadRequestException(
          'Transaction not persisted: ',
          persist.msg,
        );
      }

      console.log('persist', persist);
      //add condition when payment from wallet is implemented
      if (persist.payload.mode === TransactionMode.CREDIT && true) {
        persist = await this.updateWalletBalance(
          walletId,
          persist.payload.amount,
        );
      }

      return persist;
    } catch (err) {
      return {
        isPersist: false,
        msg: err.message,
        payload: null,
      };
    }
  }

  async depositTransaction(
    amount: number,
    walletId: number,
    paymentId: number,
  ): Promise<IPersist<{ amount: number; mode: TransactionMode } | null>> {
    try {
      const model = this.transactionRepository.create({
        type: TransactionType.DEPOSIT,
        mode: TransactionMode.CREDIT,
        status: TransactionStatus.COMPLETED,
        amount,
        wallet: { id: walletId },
        payment: { id: paymentId },
      });

      const transaction = await this.transactionRepository.save(model);

      return {
        isPersist: true,
        msg: 'Transaction persisted successfully',
        payload: {
          amount: Number(transaction.amount),
          mode: TransactionMode.CREDIT,
        },
      };
    } catch (err) {
      return {
        isPersist: false,
        msg: err.message,
        payload: null,
      };
    }
  }

  async bookingTransaction(
    amount: number,
    walletId: number,
    paymentId: number,
    transactionId?: number,
    status?: TransactionStatus,
  ): Promise<IPersist<{ amount: number; mode: TransactionMode } | null>> {
    try {
      const model = this.transactionRepository.create({
        type: TransactionType.BOOKING,
        mode: TransactionMode.DEBIT,
        status: TransactionStatus.PROCESSED, // awaiting review
        amount,
        wallet: { id: walletId },
        payment: { id: paymentId },
      });

      if (transactionId && status) {
        model.id = transactionId;
        model.status = status;
      }

      const transaction = await this.transactionRepository.save(model);

      // Create notification for the host
      const message: INotification<any> = {
        user: 1 as unknown as number,
        type: NotificationType.BOOKING_REQUEST,
        title: 'New Booking Request',
        message: `You have received a new booking request`,
        status: NotificationStatus.UNREAD,
      };

      // Publish notification to RabbitMQ queue
      await this.rabbitMQ.pushToQueue(QUEUE_NAME.NOTIFICATION, message);

      return {
        isPersist: true,
        msg: 'Transaction persisted successfully',
        payload: {
          amount: Number(-transaction.amount),
          mode: TransactionMode.DEBIT,
        },
      };
    } catch (err) {
      return {
        isPersist: false,
        msg: err.message,
        payload: null,
      };
    }
  }

  async handleBookingApproval(bookingId: number) {
    try {
      const booking = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.guest', 'guest')
        .leftJoinAndSelect('booking.host', 'host')
        .leftJoinAndSelect('guest.wallet', 'guestWallet')
        .leftJoinAndSelect('host.wallet', 'hostWallet')
        .leftJoinAndSelect('booking.invoice', 'invoice')
        .leftJoinAndSelect('invoice.payment', 'payment')
        .where('booking.id = :bookingId', { bookingId })
        .getOne();

      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      // Find the guest's debit transaction using QueryBuilder
      const guestDebitTransaction = await this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.payment', 'payment')
        .leftJoinAndSelect('payment.invoice', 'invoice')
        .leftJoinAndSelect('invoice.booking', 'booking')
        .where('booking.id = :bookingId', { bookingId })
        .andWhere('transaction.type = :type', { type: TransactionType.BOOKING })
        .andWhere('transaction.mode = :mode', { mode: TransactionMode.DEBIT })
        .andWhere('transaction.status = :status', {
          status: TransactionStatus.PROCESSED,
        })
        .getOne();

      if (!guestDebitTransaction) {
        throw new BadRequestException('Guest debit transaction not found');
      }

      // Update guest's transaction status to completed
      await this.transactionRepository
        .createQueryBuilder()
        .update(Transaction)
        .set({ status: TransactionStatus.COMPLETED })
        .where('id = :id', { id: guestDebitTransaction.id })
        .execute();

      // Create credit transaction for host
      const hostCreditTransaction = await this.transactionRepository
        .createQueryBuilder()
        .insert()
        .into(Transaction)
        .values({
          type: TransactionType.BOOKING,
          mode: TransactionMode.CREDIT,
          status: TransactionStatus.COMPLETED,
          amount: booking.invoice.hostTotal,
          wallet: { id: booking.host.wallet.id },
          payment: { id: booking.invoice.payment.id },
        })
        .execute();

      // Update host's wallet balance using QueryBuilder
      await this.updateWalletBalance(
        booking.host.wallet.id,
        booking.invoice.hostTotal,
      );

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Booking approved and transactions processed successfully',
        data: {
          guestTransaction: guestDebitTransaction,
          hostTransaction: hostCreditTransaction,
        },
      };
    } catch (err) {
      handleError(err);
    }
  }

  async handleBookingRejection(bookingId: number) {
    try {
      const booking = await this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.guest', 'guest')
        .leftJoinAndSelect('guest.wallet', 'guestWallet')
        .leftJoinAndSelect('booking.invoice', 'invoice')
        .leftJoinAndSelect('invoice.payment', 'payment')
        .where('booking.id = :bookingId', { bookingId })
        .getOne();

      if (!booking) {
        throw new BadRequestException('Booking not found');
      }

      const message = {
        type: 'PROCESS_REFUND',
        bookingId,
      };
      // Queue the refund process
      await this.rabbitMQ.pushToQueue(QUEUE_NAME.PAYMENT, message);

      // Return immediate response
      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Refund process queued',
        data: null,
      };
    } catch (err) {
      handleError(err);
    }
  }
}
