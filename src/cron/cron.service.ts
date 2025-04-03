import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Booking } from 'rdbms/entities/Booking.entity';
import { BookingStatus, NotificationType, NotificationStatus } from 'enums';
import { NotificationService } from 'src/app/notification/notification.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Check for bookings with arrival date matching the current date
   * and update their status to CURRENT
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkBookingArrivalDates() {
    this.logger.log('Running booking arrival date check...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find bookings that start today and are in UPCOMING status
      const bookingsToUpdate = await this.bookingRepository.find({
        where: {
          startDate: MoreThanOrEqual(today),
          endDate: LessThanOrEqual(tomorrow),
          status: BookingStatus.UPCOMING,
        },
        relations: ['guest', 'host', 'property'],
      });

      this.logger.log(
        `Found ${bookingsToUpdate.length} bookings to update to CURRENT status`,
      );

      // Update each booking's status and send notifications
      for (const booking of bookingsToUpdate) {
        // Update booking status to CURRENT
        await this.bookingRepository.update(booking.id, {
          status: BookingStatus.CURRENT,
        });

        // Send notification to guest
        await this.notificationService.createNotification({
          user: booking.guest.id,
          type: NotificationType.BOOKING_APPROVED,
          title: 'Booking Started',
          message: `Your booking at ${booking.property.name} has started today.`,
          status: NotificationStatus.UNREAD,
          data: {
            bookingId: booking.id,
            propertyId: booking.property.id,
          },
        });

        // Send notification to host
        await this.notificationService.createNotification({
          user: booking.host.id,
          type: NotificationType.BOOKING_APPROVED,
          title: 'Guest Checked In',
          message: `A guest checks in at ${booking.property.name} today.`,
          status: NotificationStatus.UNREAD,
          data: {
            bookingId: booking.id,
            propertyId: booking.property.id,
          },
        });

        this.logger.log(
          `Updated booking ${booking.id} to CURRENT status and sent notifications`,
        );
      }

      this.logger.log('Booking arrival date check completed successfully');
    } catch (error) {
      this.logger.error('Error checking booking arrival dates:', error);
    }
  }

  /**
   * Check for bookings that have ended and update their status to COMPLETED
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkBookingEndDates() {
    this.logger.log('Running booking end date check...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Find bookings that ended yesterday and are in CURRENT status
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const bookingsToComplete = await this.bookingRepository.find({
        where: {
          endDate: LessThanOrEqual(yesterday),
          status: BookingStatus.CURRENT,
        },
        relations: ['guest', 'host', 'property'],
      });

      this.logger.log(
        `Found ${bookingsToComplete.length} bookings to update to COMPLETED status`,
      );

      // Update each booking's status and send notifications
      for (const booking of bookingsToComplete) {
        // Update booking status to COMPLETED
        await this.bookingRepository.update(booking.id, {
          status: BookingStatus.COMPLETED,
        });

        // Send notification to guest
        await this.notificationService.createNotification({
          user: booking.guest.id,
          type: NotificationType.SYSTEM,
          title: 'Booking Completed',
          message: `Your booking at ${booking.property.name} has ended.`,
          status: NotificationStatus.UNREAD,
          data: {
            bookingId: booking.id,
            propertyId: booking.property.id,
          },
        });

        // Send notification to host
        await this.notificationService.createNotification({
          user: booking.host.id,
          type: NotificationType.SYSTEM,
          title: 'Booking Completed',
          message: `A guest has checked out from ${booking.property.name}.`,
          status: NotificationStatus.UNREAD,
          data: {
            bookingId: booking.id,
            propertyId: booking.property.id,
          },
        });

        this.logger.log(
          `Updated booking ${booking.id} to COMPLETED status and sent notifications`,
        );
      }

      this.logger.log('Booking end date check completed successfully');
    } catch (error) {
      this.logger.error('Error checking booking end dates:', error);
    }
  }
}
