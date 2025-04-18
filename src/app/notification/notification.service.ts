import React from 'react';
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
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  QUEUE_NAME,
  ResponseStatus,
} from 'enums';
import { getEnvVariable, handleError } from 'utils/helper-methods';
import { INotification } from 'interfaces';
import { NotificationGateway } from './notification.gateway';
import { RabbitMQSingleton } from '../../rabbitmq/rabbitmq.singleton';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/welcome-email';
import { VerificationEmail } from './templates/verification-email';
import { PushNotificationService } from './push-notification.service';

@Injectable()
export class NotificationService {
  private readonly resend = new Resend(getEnvVariable('RESEND_API_KEY'));

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
    @Inject('RABBITMQ_SINGLETON')
    private readonly rabbitMQ: RabbitMQSingleton,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async process(message) {
    try {
      switch (message.channel) {
        case NotificationChannel.EMAIL:
          this.handleEmailInQueue(message);
          break;
        case NotificationChannel.SMS:
          break;
        case NotificationChannel.SMS_EMAIL:
          break;
        case NotificationChannel.IN_APP:
          await this.createNotification(message);
          break;
        case NotificationChannel.PUSH:
          await this.handlePushNotificationInQueue(message);
          break;
        default:
          console.warn(
            `Unknown notification message channel: ${message.channel}`,
          );
      }
    } catch (err) {
      handleError(err);
    }
  }

  async createNotification(data: INotification) {
    if (!data.user) return;

    try {
      const notification = this.notificationRepository.create({
        user: { id: data.user.id },
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        status: NotificationStatus.UNREAD,
      });
      const savedNotification =
        await this.notificationRepository.save(notification);
      await this.notificationGateway.sendNotificationToUser(data.user.id, data);
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

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({
        from: `Percher <${getEnvVariable('RESEND_FROM_EMAIL')}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (err) {
      console.error('❌ Error sending email:', err);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    const emailComponent = WelcomeEmail({ name });
    const html = await render(emailComponent);
    await this.sendEmail(to, 'Welcome to Our App!', html);
  }

  async sendVerificationEmail(to: string, otp: string) {
    const emailComponent = VerificationEmail({ otp });
    const html = await render(emailComponent);
    await this.sendEmail(to, 'Verify Your Email Address', html);
  }

  async handleEmailInQueue(message: INotification) {
    switch (message.type) {
      case NotificationType.EMAIL_VERIFICATION:
        await this.sendVerificationEmail(
          'barrakudadev@gmail.com',
          message.data?.otp,
        );
        break;
    }
  }

  async handlePushNotificationInQueue(message: INotification) {
    if (!message.user?.expoPushToken) return;
    console.log(`sending push notification for: ${message}`);
    await this.pushNotificationService.sendPushNotification(
      message.user.expoPushToken,
      message.title,
      message.message,
      message.data,
    );
  }
}
