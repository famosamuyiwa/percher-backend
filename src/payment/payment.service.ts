import {
  BadRequestException,
  HttpException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import { Repository } from 'typeorm';
import { Request } from 'express';
import * as crypto from 'crypto';
import {
  IPaymentInitResponse,
  IPaymentVerifyResponse,
  PaymentInitDTO,
  PaystackInit,
} from './dto/payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'rdbms/entities/Payment.entity';
import { PaymentStatus } from 'enums';

@Injectable()
export class PaymentService {
  private readonly PAYSTACK_SECRET_KEY: string =
    process.env.PAYSTACK_SECRET_KEY ??
    (() => {
      throw new Error(
        'PAYSTACK_SECRET_KEY is not set in environment variables',
      );
    })();
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}
  async initPayment(input: PaymentInitDTO) {
    const response = await this.paystackApiAxiosClient<
      IPaymentInitResponse,
      PaystackInit
    >('post', 'transaction/initialize', {
      ...input,
      amount: input.amount * 100,
      callback_url: 'http://localhost:3001/webhook',
    });

    return {
      message: 'Payment initialized successfully',
      url: response.data.authorization_url,
    };
  }

  async verifyPayment(reference: string) {
    const existingRef = await this.paymentRepository.findOne({
      where: { reference },
    });

    if (existingRef) {
      return {
        message: 'Payment already verified',
      };
    }

    const response = await this.paystackApiAxiosClient<
      IPaymentVerifyResponse,
      null
    >('get', `transaction/verify/${reference}`);

    if (response.data.status !== 'success') {
      throw new UnprocessableEntityException(response.message);
    }

    const payment = this.paymentRepository.create({
      amount: response.data.amount / 100,
      email: response.data.customer.email,
      reference: response.data.reference,
      status: response.data.status as PaymentStatus,
    });

    await this.paymentRepository.save(payment);

    return {
      message: 'Payment verified successfully',
    };
  }

  private async verifySignature(input: Request) {
    console.log(input.headers);
    const signature = input.headers['x-paystack-signature'];

    const hash = crypto
      .createHmac('sha512', this.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(input.body))
      .digest('hex');

    return hash === signature;
  }

  async verifyWebhook(input: Request) {
    console.log(input);
    const isSignatureValid = await this.verifySignature(input);

    if (!isSignatureValid) {
      console.log('Signature is not valid');
      return;
    }

    const event = input.body;

    console.log('first event', event);

    if (event.event === 'charge.success') {
      console.log('Charge Success');
      await this.verifyPayment(event.data.reference);
    }

    return {
      message: 'Webhook verified successfully',
    };
  }

  async paystackApiAxiosClient<ResponseT, RequestT>(
    method: 'post' | 'get',
    route: string,
    payload?: RequestT,
  ): Promise<ResponseT> {
    const CONFIG = {
      baseURL: 'https://api.paystack.co',
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
    return await this.paymentRepository.find();
  }
}
