import { ConfigService } from '@nestjs/config';

export const getRabbitMQConfig = (configService: ConfigService) => ({
  uri: configService.get<string>('RABBITMQ_URI', 'amqp://localhost:5672'),
  exchanges: {
    notification: 'notification_exchange',
    payment: 'payment_exchange',
    booking_status: 'booking_status_exchange',
  },
  queues: {
    notification: 'notification_queue',
    payment: 'payment_queue',
    booking_status: 'booking_status_queue',
  },
  routingKeys: {
    notification: 'notification.create',
    payment: 'payment.process',
    booking_status: 'booking_status.update',
  },
  options: {
    heartbeat: 30, // Reduced from 60 to 30 seconds
    connectionTimeout: 30000, // Increased from 10000 to 30000 ms
    prefetch: 1, // Process one message at a time
    persistent: true, // Messages persist after broker restart
    durable: true, // Queues persist after broker restart
    reconnect: true, // Enable automatic reconnection
    reconnectDelay: 5000, // 5 seconds between reconnection attempts
  },
});
