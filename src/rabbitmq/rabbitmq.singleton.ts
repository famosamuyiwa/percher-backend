import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAME } from 'enums';

export interface QueueConfig {
  name: string;
  exchange: string;
  routingKey: string;
  options?: {
    durable?: boolean;
    persistent?: boolean;
    prefetch?: number;
    maxRetries?: number;
    retryDelay?: number;
    messageTtl?: number;
  };
}

@Injectable()
export class RabbitMQSingleton implements OnModuleInit, OnModuleDestroy {
  private static instance: RabbitMQSingleton;
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly DEFAULT_OPTIONS = {
    durable: true,
    persistent: true,
    prefetch: 1,
    maxRetries: 3,
    retryDelay: 5000,
    messageTtl: 60000,
  };
  private readonly RECONNECT_DELAY = 5000;
  private isConnecting = false;
  private queues: Map<string, QueueConfig> = new Map();

  private constructor(private readonly configService: ConfigService) {}

  static getInstance(configService: ConfigService): RabbitMQSingleton {
    if (!RabbitMQSingleton.instance) {
      RabbitMQSingleton.instance = new RabbitMQSingleton(configService);
    }
    return RabbitMQSingleton.instance;
  }

  async onModuleInit() {
    await this.connect();
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
      await this.channel.checkQueue(this.queues.values().next().value.name);
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
      if (await this.checkConnection()) {
        console.log('Connection is already valid');
        this.isConnecting = false;
        return;
      }

      await this.close();
      await this.connect();
      await this.setupQueues();
      console.log('Successfully reconnected to RabbitMQ');
    } catch (error) {
      console.error('Failed to reconnect to RabbitMQ:', error);
      setTimeout(() => this.reconnect(), this.RECONNECT_DELAY);
    } finally {
      this.isConnecting = false;
    }
  }

  private async connect() {
    try {
      const uri = this.configService.get<string>(
        'RABBITMQ_URI',
        'amqp://localhost:5672',
      );
      this.connection = await amqp.connect(uri);
      this.channel = await this.connection.createChannel();
      console.log('Successfully connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async setupQueues() {
    for (const [queueName, config] of this.queues) {
      await this.setupQueue(queueName, config);
    }
  }

  private async setupQueue(queueName: string, config: QueueConfig) {
    try {
      const options = { ...this.DEFAULT_OPTIONS, ...config.options };
      const dlxName = `${config.exchange}_dlx`;
      const dlqName = `${queueName}_dlq`;

      // Setup exchanges
      await this.channel.assertExchange(config.exchange, 'direct', {
        durable: options.durable,
      });
      await this.channel.assertExchange(dlxName, 'direct', {
        durable: options.durable,
      });

      // Setup queues
      await this.channel.assertQueue(queueName, {
        durable: options.durable,
        arguments: {
          'x-dead-letter-exchange': dlxName,
          'x-dead-letter-routing-key': `${config.routingKey}_dlq`,
        },
      });

      await this.channel.assertQueue(dlqName, {
        durable: options.durable,
        arguments: {
          'x-message-ttl': options.messageTtl,
          'x-dead-letter-exchange': config.exchange,
          'x-dead-letter-routing-key': config.routingKey,
        },
      });

      // Bind queues
      await this.channel.bindQueue(
        queueName,
        config.exchange,
        config.routingKey,
      );
      await this.channel.bindQueue(
        dlqName,
        dlxName,
        `${config.routingKey}_dlq`,
      );

      console.log(`Successfully setup queue: ${queueName}`);
    } catch (error) {
      console.error(`Failed to setup queue ${queueName}:`, error);
      throw error;
    }
  }

  async registerQueue(queueName: QUEUE_NAME) {
    const config = {
      name: queueName,
      exchange: queueName,
      routingKey: queueName,
      options: {
        durable: true,
        persistent: true,
        prefetch: 1,
        maxRetries: 3,
        retryDelay: 5000,
        messageTtl: 60000,
      },
    };
    this.queues.set(queueName, config);
    if (this.channel) {
      await this.setupQueue(queueName, config);
    }
  }

  async pushToQueue(
    queueName: string,
    message: any,
    retryCount: number = 0,
  ): Promise<boolean> {
    try {
      if (!(await this.checkConnection())) {
        await this.reconnect();
      }

      const config = this.queues.get(queueName);
      if (!config) {
        throw new Error(`Queue ${queueName} not registered`);
      }

      message.notificationId = Date.now();
      message.createdAt = new Date().toISOString();

      const messageWithRetry = {
        ...message,
        retryCount,
        timestamp: new Date().toISOString(),
      };

      const result = this.channel.publish(
        config.exchange,
        config.routingKey,
        Buffer.from(JSON.stringify(messageWithRetry)),
        {
          persistent:
            config.options?.persistent ?? this.DEFAULT_OPTIONS.persistent,
        },
      );
      console.log(
        `Message published successfully to queue ${queueName}:`,
        result,
      );
      return result;
    } catch (error) {
      console.error(`Failed to publish message to queue ${queueName}:`, error);
      throw error;
    }
  }

  async consumeMessages(
    queueName: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      if (!(await this.checkConnection())) {
        await this.reconnect();
      }

      const config = this.queues.get(queueName);
      if (!config) {
        throw new Error(`Queue ${queueName} not registered`);
      }

      const options = { ...this.DEFAULT_OPTIONS, ...config.options };

      await this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Received message from queue ${queueName}:`, content);

            try {
              await callback(content);
              this.channel.ack(msg);
              console.log(
                `Message processed successfully from queue ${queueName}`,
              );
            } catch (error) {
              console.error(
                `Error processing message from queue ${queueName}:`,
                error,
              );

              if (
                content.retryCount <
                (options.maxRetries ?? this.DEFAULT_OPTIONS.maxRetries)
              ) {
                await this.pushToQueue(
                  queueName,
                  content,
                  content.retryCount + 1,
                );
                this.channel.ack(msg);
                console.log(
                  `Message requeued for retry ${content.retryCount + 1}`,
                );
              } else {
                this.channel.nack(msg, false, false);
                console.log(
                  `Message moved to dead letter queue for ${queueName}`,
                );
              }
            }
          } catch (parseError) {
            console.error(
              `Error parsing message from queue ${queueName}:`,
              parseError,
            );
            this.channel.nack(msg, false, false);
          }
        }
      });
      console.log(`Started consuming messages from queue: ${queueName}`);
    } catch (error) {
      console.error(
        `Failed to consume messages from queue ${queueName}:`,
        error,
      );
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
