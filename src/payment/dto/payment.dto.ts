import { IsEmail, IsEnum, IsNumber } from 'class-validator';
import { PaymentType, TransactionType } from 'enums';

export class PaymentInitDTO {
  @IsNumber()
  amount: number;

  @IsEmail()
  email: string;
}

export class PaystackInit extends PaymentInitDTO {
  callback_url: string;
}

export interface IPaymentInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface IPaymentVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string; // 'success'
    reference: string;
    amount: number;
    gateway_response: string; // Successful
    currency: string;
    fees: number;
    requested_amount: number;
    customer: {
      email: string;
    };
  };
}

export class CreatePaymentDTO {
  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  transactionType: TransactionType;
}
