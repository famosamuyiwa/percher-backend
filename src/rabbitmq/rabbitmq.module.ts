import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRabbitMQConfig } from '../config/rabbitmq.config';
import { RabbitMQSingleton } from './rabbitmq.singleton';
import { RABBITMQ_SINGLETON } from 'enums';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'RABBITMQ_CONFIG',
      useFactory: (configService) => getRabbitMQConfig(configService),
      inject: [ConfigService],
    },
    {
      provide: RABBITMQ_SINGLETON,
      useFactory: (configService) =>
        RabbitMQSingleton.getInstance(configService),
      inject: [ConfigService],
    },
  ],
  exports: [RABBITMQ_SINGLETON],
})
export class RabbitMQModule {}
