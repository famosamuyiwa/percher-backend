import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'rdbms/entities/Booking.entity';
import { Invoice } from 'rdbms/entities/Invoice.entity';
import { BookingStatusQueueService } from './booking-status-queue.service';
import { PaymentModule } from 'src/app/payment/payment.module';
import { NotificationModule } from 'src/app/notification/notification.module';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';
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
