import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { getRabbitMQConfig } from '../config/rabbitmq.config';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private readonly RECONNECT_DELAY = 5000; // 5 seconds
  private isConnecting = false;

  constructor(
    @Inject('RABBITMQ_CONFIG')
    private readonly config: ReturnType<typeof getRabbitMQConfig>,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupExchangesAndQueues();
    this.setupConnectionHandlers();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private setupConnectionHandlers() {
    this.connection.on('error', async (error) => {
      console.error('RabbitMQ connection error:', error);
      await this.reconnect();
    });

    this.connection.on('close', async () => {
      console.log('RabbitMQ connection closed');
      await this.reconnect();
    });

    this.channel.on('error', async (error) => {
      console.error('RabbitMQ channel error:', error);
      await this.reconnect();
    });

    this.channel.on('close', async () => {
      console.log('RabbitMQ channel closed');
      await this.reconnect();
    });
  }

  private async checkConnection() {
    try {
      if (!this.connection || !this.channel) {
        return false;
      }

      // Try to send a test message to check connection
      await this.channel.checkQueue(this.config.queues.notification);
      return true;
    } catch (error) {
      console.log('Connection check failed:', error.message);
      return false;
    }
  }

  private async reconnect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      // Check if we already have a valid connection
      if (await this.checkConnection()) {
        console.log('Connection is already valid');
        this.isConnecting = false;
        return;
      }

      await this.close();
      await this.connect();
      await this.setupExchangesAndQueues();
      console.log('Successfully reconnected to RabbitMQ');
    } catch (error) {
      console.error('Failed to reconnect to RabbitMQ:', error);
      // Try to reconnect after delay
      setTimeout(() => this.reconnect(), this.RECONNECT_DELAY);
    } finally {
      this.isConnecting = false;
    }
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

      console.log('Successfully connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupExchangesAndQueues() {
    try {
      // First, check if queues and exchanges exist with correct configuration
      try {
        // Check main exchange
        await this.channel.checkExchange(this.config.exchanges.notification);

        // Check dead letter exchange
        await this.channel.checkExchange(
          `${this.config.exchanges.notification}_dlx`,
        );

        // Check main queue
        const mainQueue = await this.channel.checkQueue(
          this.config.queues.notification,
        );
        const mainQueueArgs = mainQueue?.arguments || {};

        // Check dead letter queue
        const dlq = await this.channel.checkQueue(
          `${this.config.queues.notification}_dlq`,
        );
        const dlqArgs = dlq?.arguments || {};

        // Verify queue configurations
        const mainQueueConfigCorrect =
          mainQueueArgs['x-dead-letter-exchange'] ===
            `${this.config.exchanges.notification}_dlx` &&
          mainQueueArgs['x-dead-letter-routing-key'] ===
            `${this.config.routingKeys.notification}_dlq`;

        const dlqConfigCorrect =
          dlqArgs['x-message-ttl'] === 60000 &&
          dlqArgs['x-dead-letter-exchange'] ===
            this.config.exchanges.notification &&
          dlqArgs['x-dead-letter-routing-key'] ===
            this.config.routingKeys.notification;

        if (mainQueueConfigCorrect && dlqConfigCorrect) {
          console.log(
            'Existing queues and exchanges have correct configuration',
          );
          return;
        }

        // If configurations don't match, delete and recreate
        console.log('Queue configurations need to be updated');
        await this.channel.deleteQueue(
          `${this.config.queues.notification}_dlq`,
        );
        await this.channel.deleteQueue(this.config.queues.notification);
        await this.channel.deleteExchange(
          `${this.config.exchanges.notification}_dlx`,
        );
        await this.channel.deleteExchange(this.config.exchanges.notification);
      } catch (error) {
        // If queues/exchanges don't exist, continue with creation
        console.log('Creating new queues and exchanges');
      }

      // Setup main exchange
      await this.channel.assertExchange(
        this.config.exchanges.notification,
        'direct',
        { durable: this.config.options.durable },
      );

      // Setup dead letter exchange
      await this.channel.assertExchange(
        `${this.config.exchanges.notification}_dlx`,
        'direct',
        { durable: this.config.options.durable },
      );

      // Setup main queue with dead letter exchange
      await this.channel.assertQueue(this.config.queues.notification, {
        durable: this.config.options.durable,
        arguments: {
          'x-dead-letter-exchange': `${this.config.exchanges.notification}_dlx`,
          'x-dead-letter-routing-key': `${this.config.routingKeys.notification}_dlq`,
        },
      });

      // Setup dead letter queue
      await this.channel.assertQueue(`${this.config.queues.notification}_dlq`, {
        durable: this.config.options.durable,
        arguments: {
          'x-message-ttl': 60000, // 1 minute
          'x-dead-letter-exchange': this.config.exchanges.notification,
          'x-dead-letter-routing-key': this.config.routingKeys.notification,
        },
      });

      // Bind queues to exchanges
      await this.channel.bindQueue(
        this.config.queues.notification,
        this.config.exchanges.notification,
        this.config.routingKeys.notification,
      );

      await this.channel.bindQueue(
        `${this.config.queues.notification}_dlq`,
        `${this.config.exchanges.notification}_dlx`,
        `${this.config.routingKeys.notification}_dlq`,
      );

      console.log('Successfully setup exchanges and queues');
    } catch (error) {
      console.error('Failed to setup exchanges and queues:', error);
      throw error;
    }
  }

  async publishMessage(
    exchange: string,
    routingKey: string,
    message: any,
    retryCount: number = 0,
  ): Promise<boolean> {
    try {
      // Check connection before publishing
      if (!(await this.checkConnection())) {
        await this.reconnect();
      }

      const messageWithRetry = {
        ...message,
        retryCount,
        timestamp: new Date().toISOString(),
      };

      const result = this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(messageWithRetry)),
        { persistent: this.config.options.persistent },
      );
      console.log('Message published successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to publish message:', error);
      throw error;
    }
  }

  async consumeMessages(
    queue: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      // Check connection before consuming
      if (!(await this.checkConnection())) {
        await this.reconnect();
      }

      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log('Received message:', content);

            try {
              await callback(content);
              this.channel.ack(msg);
              console.log('Message processed successfully');
            } catch (error) {
              console.error('Error processing message:', error);

              // Handle retry logic
              if (content.retryCount < this.MAX_RETRIES) {
                // Reject and requeue with incremented retry count
                await this.publishMessage(
                  this.config.exchanges.notification,
                  this.config.routingKeys.notification,
                  content,
                  content.retryCount + 1,
                );
                this.channel.ack(msg);
                console.log(
                  `Message requeued for retry ${content.retryCount + 1}`,
                );
              } else {
                // Move to dead letter queue after max retries
                this.channel.nack(msg, false, false);
                console.log('Message moved to dead letter queue');
              }
            }
          } catch (parseError) {
            console.error('Error parsing message:', parseError);
            this.channel.nack(msg, false, false);
          }
        }
      });
      console.log('Started consuming messages from queue:', queue);
    } catch (error) {
      console.error('Failed to consume messages:', error);
      throw error;
    }
  }

  private async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}
