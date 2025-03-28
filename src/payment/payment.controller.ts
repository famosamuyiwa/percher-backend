import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { PaymentInitDTO } from './dto/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('init')
  async initPayment(@Body() input: PaymentInitDTO) {
    return await this.paymentService.initPayment(input);
  }

  @Get('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return await this.paymentService.verifyPayment(reference);
  }

  @Get('history')
  async paymentHistory() {
    return await this.paymentService.getPayments();
  }

  @Post('webhook')
  async webhook(@Req() req: Request) {
    return await this.paymentService.verifyWebhook(req);
  }
}
