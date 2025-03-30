import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { Repository } from 'typeorm';
import { Request } from 'express';
import {
  CreatePaymentDTO,
  IPaymentInitResponse,
  IPaymentVerifyResponse,
  PaymentInitDTO,
  PaystackInit,
} from './dto/payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'rdbms/entities/Payment.entity';
import {
  BookingStatus,
  PaymentStatus,
  PaymentType,
  ResponseStatus,
  TransactionMode,
  TransactionType,
} from 'enums';
import { getEnvVariable, handleError } from 'utils/helper-methods';
import { Booking } from 'rdbms/entities/Booking.entity';
import { Filter, IPersist } from 'interfaces';
import { User } from 'rdbms/entities/User.entity';
import { Wallet } from 'rdbms/entities/Wallet.entity';
import { Transaction } from 'rdbms/entities/Transaction.entity';

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

      console.log('existingRef', existingRef);

      if (existingRef && existingRef.status !== PaymentStatus.PENDING) {
        return {
          code: HttpStatus.OK,
          status: ResponseStatus.SUCCESS,
          message: 'Payment already verified',
          data: existingRef,
        };
      }

      const response = await this.paystackApiAxiosClient<
        IPaymentVerifyResponse,
        null
      >('get', `transaction/verify/${reference}`);

      if (response.data.status !== 'success') {
        throw new UnprocessableEntityException(response.message);
      }

      let payment: Payment | undefined = undefined;
      const amount = response.data.amount / 100; // paystack deals in milliseconds, convert
      const model = {
        amount,
        email: response.data.customer.email,
        reference: response.data.reference,
        status: PaymentStatus.SUCCESS,
        type: PaymentType.CHARGE,
      };

      if (existingRef) {
        payment = await this.paymentRepository.preload({
          id: existingRef.id,
          ...model,
        });
      } else {
        payment = this.paymentRepository.create(model);
      }

      if (existingRef?.invoice?.booking?.id) {
        await this.bookingRepository.update(existingRef?.invoice?.booking?.id, {
          paymentStatus: PaymentStatus.SUCCESS,
          status: BookingStatus.PENDING,
        });
      }

      if (!payment) {
        throw new BadRequestException(
          `Something went wrong while persisting payment record with transactionRef: ${reference}`,
        );
      }

      const data = await this.paymentRepository.save(payment);

      if (!existingRef?.wallet?.id) {
        throw new BadRequestException('Wallet not found');
      }

      const walletData = await this.updateWalletBalance(
        existingRef?.wallet?.id,
        amount,
      );

      if (!walletData.isPersist) {
        throw new BadRequestException(walletData.msg);
      }

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Payment verified and persisted successfully',
        data,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async verifyWebhook(input: Request) {
    try {
      console.log('webhook input: ', input);

      const event = input.body;

      console.log('first event', event);

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
    const { amount } = createPaymentDTO;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }
    console.log('user', user);

    const payment = this.paymentRepository.create({
      reference,
      type: PaymentType.DRAFT,
      wallet: user.wallet,
      amount,
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
        default:
          throw new BadRequestException('Invalid transaction type');
      }

      if (!persist.isPersist) {
        throw new BadRequestException(
          'Transaction not persisted: ',
          persist.msg,
        );
      }

      console.log('persist', persist);

      persist = await this.updateWalletBalance(walletId, persist.payload);

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
  ): Promise<IPersist<number | null>> {
    try {
      const model = this.transactionRepository.create({
        type: TransactionType.DEPOSIT,
        mode: TransactionMode.CREDIT,
        amount,
        wallet: { id: walletId },
        payment: { id: paymentId },
      });

      const transaction = await this.transactionRepository.save(model);

      return {
        isPersist: true,
        msg: 'Transaction persisted successfully',
        payload: Number(transaction.amount),
      };
    } catch (err) {
      return {
        isPersist: true,
        msg: err.message,
        payload: null,
      };
    }
  }
}
