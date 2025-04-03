import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { INotification } from 'interfaces';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Socket> = new Map();

  constructor(
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async authenticateSocket(client: Socket): Promise<number | null> {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        console.log('No token provided');
        return null;
      }

      const jwt = token.replace('Bearer ', '');
      const payload = this.jwtService.decode(jwt);
      return Number(payload.userId);
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  async handleConnection(client: Socket) {
    try {
      const userId = await this.authenticateSocket(client);

      if (!userId) {
        console.log('Authentication failed, disconnecting client');
        client.disconnect();
        return;
      }

      // Store the socket connection
      this.userSockets.set(userId, client);

      // Send initial unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unreadCount', unreadCount);

      // Send recent notifications
      const notifications = await this.notificationService.getUserNotifications(
        userId,
        5,
      );
      client.emit('recentNotifications', notifications);

      // Send confirmation to client
      client.emit('connectionConfirmed', { userId, status: 'connected' });
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove user's socket connection
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket === client) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // Method to send notification to a specific user
  async sendNotificationToUser(
    userId: number,
    notification: INotification<any>,
  ) {
    try {
      console.log('Attempting to send notification to user:', userId);
      const userSocket = this.userSockets.get(userId);

      if (userSocket) {
        console.log('Sending notification to user:', userId);
        userSocket.emit('newNotification', notification);

        // Update unread count
        const unreadCount =
          await this.notificationService.getUnreadCount(userId);
        userSocket.emit('unreadCount', unreadCount);
      } else {
        console.log(
          'User socket not found, notification will be delivered when user reconnects',
        );
      }
    } catch (error) {
      console.error(`Error sending notification: ${error}`);
    }
  }

  // Method to broadcast notification to multiple users
  async broadcastToUsers(userIds: number[], notification: INotification<any>) {
    for (const userId of userIds) {
      await this.sendNotificationToUser(userId, notification);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, notificationId: number) {
    try {
      const token = client.handshake.auth.token;
      const jwt = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(jwt, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const userId = Number(payload.userId);

      await this.notificationService.markAsRead(notificationId, userId);

      // Update unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unreadCount', unreadCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const jwt = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(jwt, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const userId = Number(payload.userId);

      await this.notificationService.markAllAsRead(userId);
      client.emit('unreadCount', 0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}
