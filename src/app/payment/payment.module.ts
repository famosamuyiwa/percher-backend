import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Payment } from 'rdbms/entities/Payment.entity';
import { Booking } from 'rdbms/entities/Booking.entity';
import { User } from 'rdbms/entities/User.entity';
import { Wallet } from 'rdbms/entities/Wallet.entity';
import { Transaction } from 'rdbms/entities/Transaction.entity';
import { PaymentQueueService } from './payment-processing.queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Booking, User, Wallet, Transaction]),
    HttpModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentQueueService],
  exports: [PaymentService, PaymentQueueService],
})
export class PaymentModule {}
