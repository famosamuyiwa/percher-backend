import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';
import { BookingStatus, Category, ReviewAction, UserType } from 'enums';

@UseGuards(JwtAuthGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    const loggedInUserId = req.userId;
    return this.bookingService.create(createBookingDto, loggedInUserId);
  }

  @Get()
  findAll(
    @Query('limit') limit: number = 10,
    @Query('cursor') cursor: number,
    @Query('from') from: UserType,
    @Query('bookingStatus') bookingStatus: BookingStatus,
    @Request() req,
  ) {
    const loggedInUserId = req.userId;
    const filter = {
      cursor,
      limit,
      from,
      bookingStatus,
    };
    return this.bookingService.findAll(filter, loggedInUserId, cursor);
  }

  @Post('review/:id')
  reviewAction(
    @Param('id') id: number,
    @Query('action') action: ReviewAction,
    @Request() req,
  ) {
    const loggedInUserId = req.userId;
    return this.bookingService.review(id, action, loggedInUserId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.bookingService.findOneById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingService.update(+id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingService.remove(+id);
  }
}
