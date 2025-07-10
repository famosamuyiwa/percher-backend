import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Query,
  Body,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';
import { ContactFormDto } from './dto/contact-form.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('unread/count')
  async getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markAsRead(+id, req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('email-test')
  async emailTest() {
    return this.notificationService.sendVerificationEmail(
      'barrakudadev@gmail.com',
      '8070',
    );
  }

  @Post('contact-form')
  sendContactFormMessage(@Body() body: ContactFormDto) {
    return this.notificationService.sendContactFormEmail(body);
  }
}
