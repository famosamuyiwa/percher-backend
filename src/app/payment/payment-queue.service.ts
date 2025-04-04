import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { RabbitMQSingleton } from 'src/rabbitmq/rabbitmq.singleton';
import { QUEUE_NAME } from 'enums';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentQueueService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_SINGLETON')
    private readonly rabbitMQ: RabbitMQSingleton,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  async onModuleInit() {
    // Register the payment queue
    await this.rabbitMQ.registerQueue(QUEUE_NAME.PAYMENT);
    // Start consuming payment messages
    await this.rabbitMQ.consumeMessages(
      QUEUE_NAME.PAYMENT,
      this.processPaymentMessage.bind(this),
    );
  }

  private async processPaymentMessage(message: any) {
    try {
      switch (message.type) {
        case 'VERIFY_PAYMENT':
          await this.paymentService.verifyPayment(message.reference);
          break;
        case 'PROCESS_REFUND':
          await this.paymentService.handleBookingRejection(message.bookingId);
          break;
        case 'UPDATE_WALLET':
          await this.paymentService.updateWalletBalance(
            message.walletId,
            message.amount,
          );
          break;
        default:
          console.warn(`Unknown payment message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error processing payment message:', error);
      throw error;
    }
  }
}
