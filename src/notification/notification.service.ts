import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'rdbms/entities/Notification.entity';
import { User } from 'rdbms/entities/User.entity';
import { NotificationStatus, NotificationType, ResponseStatus } from 'enums';
import { handleError } from 'utils/helper-methods';
import { INotification } from 'interfaces';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(notification: INotification<any>) {
    const { user: userId, type, title, message, data } = notification;
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new Error('User not found');
      }

      const notification = this.notificationRepository.create({
        user,
        type,
        title,
        message,
        data,
        status: NotificationStatus.UNREAD,
      });

      const savedNotification =
        await this.notificationRepository.save(notification);

      // Emit notification through WebSocket
      const wsNotification: INotification<any> = {
        ...savedNotification,
        user: userId,
      };
      await this.notificationGateway.sendNotificationToUser(
        userId,
        wsNotification,
      );

      return savedNotification;
    } catch (err) {
      handleError(err);
    }
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
          const user = await this.userRepository.findOne({
            where: { id: userId },
          });
          if (!user) return null;

          const notification = this.notificationRepository.create({
            user,
            type,
            title,
            message,
            data,
            status: NotificationStatus.UNREAD,
          });

          return this.notificationRepository.save(notification);
        }),
      );

      // Filter out null notifications
      return notifications.filter((n): n is Notification => n !== null);
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
