import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import { getRabbitMQConfig } from '../config/rabbitmq.config';

@Module({
  imports: [ConfigModule],
  providers: [
    RabbitMQService,
    {
      provide: 'RABBITMQ_CONFIG',
      useFactory: (configService) => getRabbitMQConfig(configService),
      inject: [ConfigService],
    },
  ],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
