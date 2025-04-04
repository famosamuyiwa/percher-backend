import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'rdbms/entities/Booking.entity';
import { Invoice } from 'rdbms/entities/Invoice.entity';

import { PaymentModule } from 'src/payment/payment.module';
import { NotificationModule } from 'src/notification/notification.module';
import { BookingStatusQueueService } from './booking-status-queue.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Invoice]),
    PaymentModule,
    NotificationModule,
    RabbitMQModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingStatusQueueService],
})
export class BookingModule {}
