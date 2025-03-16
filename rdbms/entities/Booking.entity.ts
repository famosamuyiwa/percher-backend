import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Property } from './Property.entity';
import { BaseEntity } from './Base.entity';
import { User } from './User.entity';

@Entity('bookings')
export class Booking extends BaseEntity {
  @ManyToOne(() => User, (user) => user.guestBookings)
  @Index() // Frequently queried by guest ID
  guest: User;

  @ManyToOne(() => User, (user) => user.hostBookings)
  @Index() // Hosts will often check bookings
  host: User;

  @ManyToOne(() => Property, (property) => property.bookings)
  @Index() // Booking queries often involve properties
  property: Property;

  @Column('timestamp')
  @Index() // Filtering by date range
  startDate: Date;

  @Column('timestamp')
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  })
  @Index() // Frequent queries for approval workflow
  status: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;
}
