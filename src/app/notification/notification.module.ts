import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'rdbms/entities/Notification.entity';
import { User } from 'rdbms/entities/User.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationQueueService } from './notification.queue.service';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationQueueService,
    PushNotificationService,
  ],
  exports: [NotificationService, NotificationQueueService],
})
export class NotificationModule {}
