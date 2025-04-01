import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  Logger,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { getRabbitMQConfig } from '../config/rabbitmq.config';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly log = new Logger(RabbitMQService.name);

  constructor(
    @Inject('RABBITMQ_CONFIG')
    private readonly config: ReturnType<typeof getRabbitMQConfig>,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupExchangesAndQueues();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(
        this.config.uri,
        this.config.options,
      );
      this.channel = await this.connection.createChannel();

      // Set prefetch count
      await this.channel.prefetch(this.config.options.prefetch);

      this.log.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.log.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupExchangesAndQueues() {
    try {
      // Setup notification exchange
      await this.channel.assertExchange(
        this.config.exchanges.notification,
        'direct',
        { durable: this.config.options.durable },
      );

      // Setup notification queue
      await this.channel.assertQueue(this.config.queues.notification, {
        durable: this.config.options.durable,
      });

      // Bind queue to exchange
      await this.channel.bindQueue(
        this.config.queues.notification,
        this.config.exchanges.notification,
        this.config.routingKeys.notification,
      );
      this.log.log('Successfully setup exchanges and queues');
    } catch (error) {
      this.log.error('Failed to setup exchanges and queues:', error);
      throw error;
    }
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: any,
  ): Promise<boolean> {
    try {
      const result = this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: this.config.options.persistent },
      );
      this.log.log('Message published successfully:', result);
      return result;
    } catch (error) {
      this.log.error('Failed to publish message:', error);
      throw error;
    }
  }

  async consumeMessages(
    queue: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            this.log.log('Received message:', content);
            await callback(content);
            this.channel.ack(msg);
            this.log.log('Message processed successfully');
          } catch (error) {
            this.log.error('Error processing message:', error);
            this.channel.nack(msg);
          }
        }
      });
      this.log.log('Started consuming messages from queue:', queue);
    } catch (error) {
      this.log.error('Failed to consume messages:', error);
      throw error;
    }
  }

  private async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.log.log('RabbitMQ connection closed');
    } catch (error) {
      this.log.error('Error closing RabbitMQ connection:', error);
    }
  }
}
