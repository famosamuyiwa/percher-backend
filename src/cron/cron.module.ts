import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'rdbms/entities/Booking.entity';
import { NotificationModule } from 'src/app/notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Booking]),
    NotificationModule,
  ],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
