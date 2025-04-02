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
import {
  NotificationStatus,
  NotificationType,
  QUEUE_NAME,
  ResponseStatus,
} from 'enums';
import { handleError } from 'utils/helper-methods';
import { INotification } from 'interfaces';
import { NotificationGateway } from './notification.gateway';
import { RabbitMQSingleton } from '../../rabbitmq/rabbitmq.singleton';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly QUEUE_NAME = 'notification';
  private readonly BATCH_SIZE = 100; // Process notifications in batches of 100

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
    @Inject('RABBITMQ_SINGLETON')
    private readonly rabbitMQ: RabbitMQSingleton,
  ) {}

  async onModuleInit() {
    // Register the notification queue
    await this.rabbitMQ.registerQueue(QUEUE_NAME.NOTIFICATION);
    // Start consuming notification messages
    await this.rabbitMQ.consumeMessages(
      this.QUEUE_NAME,
      this.processNotification.bind(this),
    );
  }

  private async processNotification(message: any): Promise<void> {
    const {
      notificationId,
      user,
      type,
      title,
      message: notificationMessage,
      data,
      createdAt,
    } = message;

    try {
      await this.createNotification({
        user,
        type,
        title,
        message: notificationMessage,
        data,
        status: NotificationStatus.UNREAD,
      });
    } catch (error) {
      console.error('Error sending WebSocket notification:', error);
      throw error;
    }
  }

  async createNotification(data: INotification<any>) {
    try {
      const notification = this.notificationRepository.create(data);
      const savedNotification =
        await this.notificationRepository.save(notification);
      await this.notificationGateway.sendNotificationToUser(data.user, data);
      return savedNotification;
    } catch (error) {
      handleError(error);
    }
  }

  //   async createNotificationForUsers(
  //     userIds: number[],
  //     type: NotificationType,
  //     title: string,
  //     message: string,
  //     data?: Record<string, any>,
  //   ) {
  //     try {
  //       // Process users in batches
  //       const batches: number[][] = [];
  //       for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
  //         batches.push(userIds.slice(i, i + this.BATCH_SIZE));
  //       }

  //       const results: Notification[] = [];
  //       for (const batch of batches) {
  //         const batchNotifications = await Promise.all(
  //           batch.map(async (userId) => {
  //             const user = await this.userRepository.findOne({
  //               where: { id: userId },
  //             });
  //             if (!user) {
  //               throw new Error(`User with ID ${userId} not found`);
  //             }

  //             const notification = this.notificationRepository.create({
  //               user,
  //               type,
  //               title,
  //               message,
  //               data,
  //               status: NotificationStatus.UNREAD,
  //             });
  //             return this.createNotification(notification);
  //           }),
  //         );
  //         results.push(...batchNotifications);
  //       }

  //       return results;
  //     } catch (error) {
  //       handleError(error);
  //     }
  //   }

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
