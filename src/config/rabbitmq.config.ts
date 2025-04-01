import { ConfigService } from '@nestjs/config';

export const getRabbitMQConfig = (configService: ConfigService) => ({
  uri: configService.get<string>('RABBITMQ_URI', 'amqp://localhost:5672'),
  exchanges: {
    notification: 'notification_exchange',
  },
  queues: {
    notification: 'notification_queue',
  },
  routingKeys: {
    notification: 'notification.create',
  },
  options: {
    heartbeat: 60, // Keep connection alive
    connectionTimeout: 10000, // Connection timeout in ms
    prefetch: 1, // Process one message at a time
    persistent: true, // Messages persist after broker restart
    durable: true, // Queues persist after broker restart
  },
});
