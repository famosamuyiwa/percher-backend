import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { handleError } from 'utils/helper-methods';
import {
  BookingStatus,
  NotificationStatus,
  NotificationType,
  QUEUE_NAME,
  ResponseStatus,
  ReviewAction,
  UserType,
} from 'enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponse, Filter } from 'interfaces';
import { Booking } from 'rdbms/entities/Booking.entity';
import { BookingStatusQueueService } from './booking-status-queue.service';
import { RabbitMQSingleton } from 'src/rabbitmq/rabbitmq.singleton';
import { PaymentService } from 'src/app/payment/payment.service';
import { NotificationService } from 'src/app/notification/notification.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly bookingStatusQueueService: BookingStatusQueueService,
    @Inject('RABBITMQ_SINGLETON')
    private readonly rabbitMQ: RabbitMQSingleton,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId) {
    try {
      const model = this.bookingRepository.create({
        ...createBookingDto,
        guest: userId,
        host: createBookingDto.hostId,
        property: createBookingDto.propertyId,
        invoice: createBookingDto.invoice,
      });

      const booking = await this.bookingRepository.save(model);

      const payload: ApiResponse<Booking> = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Booking created successfully',
        data: booking,
      };
      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async findAll(filter: Filter, userId, cursor?: number) {
    const { limit, from, bookingStatus } = filter;
    try {
      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .innerJoinAndSelect('booking.property', 'property')
        .innerJoinAndSelect('booking.invoice', 'invoice')
        .andWhere('booking.status != :status', { status: BookingStatus.DRAFT })
        .orderBy('booking.id', 'DESC')
        .take(limit);

      if (bookingStatus) {
        queryBuilder.andWhere('booking.status = :bookingStatus', {
          bookingStatus,
        });
      }

      if (from === UserType.HOST) {
        queryBuilder
          .innerJoinAndSelect('booking.host', 'host')
          .andWhere('host.id = :userId', { userId })
          .innerJoinAndSelect('booking.guest', 'guest');
      }

      if (from === UserType.GUEST) {
        queryBuilder
          .innerJoinAndSelect('booking.guest', 'guest')
          .andWhere('guest.id = :userId', { userId });
      }

      // Apply cursor condition if provided
      if (cursor) {
        queryBuilder.andWhere('booking.id < :cursor', { cursor });
      }

      const bookings = await queryBuilder.getMany();

      // Get the next cursor (last record's ID)
      const nextCursor = bookings.length
        ? bookings[bookings.length - 1].id
        : null;

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Bookings fetch successful',
        data: bookings,
        nextCursor, // Return nextCursor for the next batch
      };
    } catch (err) {
      handleError(err);
    }
  }

  async findOneById(id: number) {
    try {
      const booking = await this.bookingRepository.findOne({
        where: {
          id,
        },
        relations: ['host', 'guest', 'property', 'invoice'],
      });

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Booking fetch successful',
        data: booking,
      };
    } catch (err) {
      handleError(err);
    }
  }

  update(id: number, updateBookingDto: UpdateBookingDto) {
    return `This action updates a #${id} booking`;
  }

  async remove(id: number) {
    try {
      await this.bookingRepository.delete({ id });

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Booking deleted successfully',
        data: null,
      };
      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async review(
    id: number,
    action: ReviewAction,
    userId: number,
    from: UserType,
  ) {
    try {
      console.log('reviewing booking', id, action, userId, from);
      if (!action || !id || !userId || !from)
        throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);

      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['host', 'guest'],
      });

      if (!booking)
        throw new HttpException(
          'Booking does not exist',
          HttpStatus.BAD_REQUEST,
        );

      if (from === UserType.HOST && booking?.host.id !== userId) {
        throw new HttpException(
          'You do not have permission to review this perch',
          HttpStatus.FORBIDDEN,
        );
      }

      if (from === UserType.GUEST && booking?.guest.id !== userId) {
        throw new HttpException(
          'You do not have permission to review this perch',
          HttpStatus.FORBIDDEN,
        );
      }

      const message = {
        type: 'UPDATE_STATUS',
        bookingId: id,
        status:
          action === ReviewAction.APPROVE
            ? BookingStatus.UPCOMING
            : BookingStatus.REJECTED,
      };
      // Queue the status update
      await this.rabbitMQ.pushToQueue(QUEUE_NAME.BOOKING_STATUS, message);

      const status = getStatusFromAction(action);

      await this.bookingRepository.update(id, {
        status,
      });

      // Queue payment operations
      if (action === ReviewAction.APPROVE) {
        await this.paymentService.handleBookingApproval(id);
      }

      if (action === ReviewAction.REJECT) {
        await this.paymentService.handleBookingRejection(id);
      }

      if (action === ReviewAction.CANCEL) {
        await this.paymentService.handleBookingCancellation(id);
      }

      // Return immediate response
      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Booking review process queued',
        data: null,
      };
      return payload;
    } catch (err) {
      handleError(err);
    }
  }
}

function getStatusFromAction(action: ReviewAction) {
  switch (action) {
    case ReviewAction.APPROVE:
      return BookingStatus.UPCOMING;
    case ReviewAction.REJECT:
      return BookingStatus.REJECTED;
    case ReviewAction.CANCEL:
      return BookingStatus.CANCELLED;
  }
}
