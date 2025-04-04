import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { RabbitMQSingleton } from '../rabbitmq/rabbitmq.singleton';
import { QUEUE_NAME } from 'enums';
import { BookingService } from './booking.service';
import { BookingStatus } from 'enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from 'rdbms/entities/Booking.entity';

@Injectable()
export class BookingStatusQueueService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_SINGLETON')
    private readonly rabbitMQ: RabbitMQSingleton,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async onModuleInit() {
    // Register the booking status queue
    await this.rabbitMQ.registerQueue(QUEUE_NAME.BOOKING_STATUS);
    // Start consuming booking status messages
    await this.rabbitMQ.consumeMessages(
      QUEUE_NAME.BOOKING_STATUS,
      this.processBookingStatusMessage.bind(this),
    );
  }

  private async processBookingStatusMessage(message: any) {
    try {
      console.log('message: ', message);
    } catch (error) {
      console.error('Error processing booking status message:', error);
      throw error;
    }
  }
}
