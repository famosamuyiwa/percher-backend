import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from './Property.entity';
import { BaseEntity } from './Base.entity';
import { User } from './User.entity';
import { BookingStatus, ChargeType } from 'enums';
import { Invoice } from './Invoice.entity';

@Entity('bookings')
export class Booking extends BaseEntity {
  @Column('timestamp')
  @Index() // Filtering by date range
  startDate: Date;

  @Column('timestamp')
  endDate: Date;

  @Column({ nullable: true })
  checkIn?: string;

  @Column({ nullable: true })
  checkOut?: string;

  @Column({
    type: 'enum',
    enum: ChargeType,
  })
  chargeType: ChargeType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  @Index() // Frequent queries for approval workflow
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  @ManyToOne(() => User, (user) => user.guestBookings)
  @Index() // Frequently queried by guest ID
  guest: User;

  @ManyToOne(() => User, (user) => user.hostBookings)
  @Index() // Hosts will often check bookings
  host: User;

  @ManyToOne(() => Property, (property) => property.bookings)
  @Index() // Booking queries often involve properties
  property: Property;

  @OneToOne(() => Invoice, (invoice) => invoice.booking, { cascade: true })
  @JoinColumn()
  invoice: Invoice;
}
