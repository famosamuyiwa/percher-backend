import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(
    @Request() req,
    @Query('limit') limit: number,
    @Query('cursor') cursor: number,
  ) {
    return this.notificationService.getUserNotificationsWithCursor(
      req.userId,
      limit,
      cursor,
    );
  }

  @Get('unread/count')
  async getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markAsRead(+id, req.userId);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.userId);
  }
}
