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
      await this.paymentService.process(message);
    } catch (error) {
      console.error('Error processing payment message:', error);
      throw error;
    }
  }
}
