import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'rdbms/entities/Booking.entity';
import { Invoice } from 'rdbms/entities/Invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Invoice])],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
