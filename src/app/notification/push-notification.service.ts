import { Injectable, Logger } from '@nestjs/common';
import {
  Expo,
  ExpoPushMessage,
  ExpoPushTicket,
  ExpoPushSuccessTicket,
} from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expo = new Expo();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: any,
    retryCount = 0,
  ): Promise<boolean> {
    try {
      // Validate push token
      if (!Expo.isExpoPushToken(expoPushToken)) {
        this.logger.warn(`Invalid Expo push token: ${expoPushToken}`);
        return false;
      }

      // Construct the message
      const message: ExpoPushMessage = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'default',
      };

      // Send the message
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error('Error sending push notification chunk:', error);
          throw error;
        }
      }

      // Check receipts after a delay
      setTimeout(() => this.checkReceipts(tickets), 5000);

      return true;
    } catch (error) {
      this.logger.error('Error sending push notification:', error);

      // Implement retry logic
      if (retryCount < this.MAX_RETRIES) {
        this.logger.log(
          `Retrying push notification (attempt ${retryCount + 1})`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)),
        );
        return this.sendPushNotification(
          expoPushToken,
          title,
          body,
          data,
          retryCount + 1,
        );
      }

      return false;
    }
  }

  private async checkReceipts(tickets: ExpoPushTicket[]) {
    try {
      const receiptIds = tickets
        .filter((ticket): ticket is ExpoPushSuccessTicket => 'id' in ticket)
        .map((ticket) => ticket.id);

      if (receiptIds.length === 0) {
        return;
      }

      const receipts =
        await this.expo.getPushNotificationReceiptsAsync(receiptIds);

      for (const receiptId of Object.keys(receipts)) {
        const receipt = receipts[receiptId];

        if (receipt.status === 'error') {
          this.logger.error(`Push notification error: ${receipt.message}`);

          if (receipt.details?.error === 'DeviceNotRegistered') {
            // Handle invalid/expired tokens
            this.logger.warn(`Device not registered, token should be removed`);
            // TODO: Implement token removal logic
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking push notification receipts:', error);
    }
  }

  async sendBulkPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    for (const token of tokens) {
      const success = await this.sendPushNotification(token, title, body, data);
      if (success) {
        results.success.push(token);
      } else {
        results.failed.push(token);
      }
    }

    return results;
  }
}
