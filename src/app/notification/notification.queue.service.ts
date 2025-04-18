import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { RabbitMQSingleton } from 'src/rabbitmq/rabbitmq.singleton';
import { QUEUE_NAME } from 'enums';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationQueueService implements OnModuleInit {
  constructor(
    @Inject('RABBITMQ_SINGLETON')
    private readonly rabbitMQ: RabbitMQSingleton,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    // Register the payment queue
    await this.rabbitMQ.registerQueue(QUEUE_NAME.NOTIFICATION);
    // Start consuming payment messages
    await this.rabbitMQ.consumeMessages(
      QUEUE_NAME.NOTIFICATION,
      this.processNotificationMessage.bind(this),
    );
  }

  private async processNotificationMessage(message: any) {
    try {
      await this.notificationService.process(message);
    } catch (error) {
      console.error('Error processing notification message:', error);
      throw error;
    }
  }
}
