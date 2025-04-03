import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDTO, PaymentInitDTO } from './dto/payment.dto';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('init')
  async initPayment(@Body() input: PaymentInitDTO) {
    return await this.paymentService.initPayment(input);
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/:reference')
  async verifyPayment(@Param('reference') reference: string) {
    return await this.paymentService.verifyPayment(reference);
  }

  @UseGuards(JwtAuthGuard)
  @Get('')
  findAll(
    @Query('limit') limit: number = 10,
    @Query('cursor') cursor: number,
    @Request() req,
  ) {
    const loggedInUserId = req.userId;
    const filter = {
      cursor,
      limit,
    };
    return this.paymentService.findAll(filter, loggedInUserId, cursor);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':reference')
  createPayment(
    @Param('reference') reference: string,
    @Body() body: CreatePaymentDTO,
    @Request() req,
  ) {
    const loggedInUserId = req.userId;
    return this.paymentService.createPayment(reference, body, loggedInUserId);
  }

  //endpoint must be exposed to allow only whitelisted paystack IPs
  @Post('webhook')
  async webhook(@Req() req: ExpressRequest) {
    return await this.paymentService.verifyWebhook(req);
  }
}
