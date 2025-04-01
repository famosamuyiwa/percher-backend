import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'rdbms/entities/Notification.entity';
import { User } from 'rdbms/entities/User.entity';
import { NotificationStatus, NotificationType, ResponseStatus } from 'enums';
import { handleError } from 'utils/helper-methods';
import { INotification } from 'interfaces';
import { NotificationGateway } from './notification.gateway';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { getRabbitMQConfig } from '../config/rabbitmq.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService implements OnModuleInit {
  private rabbitConfig: ReturnType<typeof getRabbitMQConfig>;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
    private readonly rabbitMQService: RabbitMQService,
    private readonly configService: ConfigService,
  ) {
    this.rabbitConfig = getRabbitMQConfig(configService);
  }

  async onModuleInit() {
    // Start consuming notification messages
    await this.rabbitMQService.consumeMessages(
      this.rabbitConfig.queues.notification,
      this.processNotification.bind(this),
    );
  }

  private async processNotification(notification: INotification<any>) {
    const { user: userId, type, title, message, data } = notification;
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('User not found');
      }

      const newNotification = this.notificationRepository.create({
        user,
        type,
        title,
        message,
        data,
        status: NotificationStatus.UNREAD,
      });

      const savedNotification =
        await this.notificationRepository.save(newNotification);

      // Emit notification through WebSocket
      const wsNotification: INotification<any> = {
        ...savedNotification,
        user: userId,
      };

      try {
        await this.notificationGateway.sendNotificationToUser(
          userId,
          wsNotification,
        );
      } catch (wsError) {
        // Log the WebSocket error but don't fail the notification creation
        console.log(
          `WebSocket notification failed for user ${userId}:`,
          wsError.message,
        );
      }

      return savedNotification;
    } catch (err) {
      handleError(err);
    }
  }

  async createNotification(notification: INotification<any>) {
    // Publish notification to RabbitMQ
    await this.rabbitMQService.publishMessage(
      this.rabbitConfig.exchanges.notification,
      this.rabbitConfig.routingKeys.notification,
      notification,
    );
    return notification;
  }

  async createNotificationForUsers(
    userIds: number[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ) {
    try {
      const notifications = await Promise.all(
        userIds.map(async (userId) => {
          const notification: INotification<any> = {
            user: userId,
            type,
            title,
            message,
            data,
            status: NotificationStatus.UNREAD,
          };
          return this.createNotification(notification);
        }),
      );

      return notifications;
    } catch (error) {
      handleError(error);
    }
  }

  async getUserNotifications(userId: number, limit: number = 20) {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user.id = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getUserNotificationsWithCursor(
    userId: number,
    limit: number = 20,
    cursor?: number,
  ) {
    try {
      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.user.id = :userId', { userId })
        .orderBy('notification.createdAt', 'DESC')
        .take(limit);

      // Apply cursor condition if provided
      if (cursor) {
        queryBuilder.andWhere('notification.id < :cursor', { cursor });
      }

      const notifications = await queryBuilder.getMany();

      // Get the next cursor (last record's ID)
      const nextCursor = notifications.length
        ? notifications[notifications.length - 1].id
        : null;

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Notifications fetch successful',
        data: notifications,
        nextCursor, // Return nextCursor for the next batch
      };
    } catch (err) {
      handleError(err);
    }
  }

  async markAsRead(notificationId: number, userId: number) {
    return this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ status: NotificationStatus.READ })
      .where('id = :notificationId AND user.id = :userId', {
        notificationId,
        userId,
      })
      .execute();
  }

  async markAllAsRead(userId: number) {
    return this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ status: NotificationStatus.READ })
      .where('user.id = :userId AND status = :status', {
        userId,
        status: NotificationStatus.UNREAD,
      })
      .execute();
  }

  async getUnreadCount(userId: number) {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user.id = :userId', { userId })
      .andWhere('notification.status = :status', {
        status: NotificationStatus.UNREAD,
      })
      .getCount();
  }
}
