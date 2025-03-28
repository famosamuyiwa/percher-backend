import { Entity, Column, ManyToOne, OneToMany, Index, OneToOne } from 'typeorm';
import { User } from './User.entity';
import { Booking } from './Booking.entity';
import { BaseEntity } from './Base.entity';
import { Review } from './Review.entity';
import {
  Category,
  ChargeType,
  Facility,
  PerchTypes,
  RegistrationStatus,
} from 'enums';
import { Invoice } from './Invoice.entity';

@Entity('properties')
export class Property extends BaseEntity {
  @Column()
  @Index() // Quick searches based on title
  name: string;

  @Column()
  @Index()
  bed: number;

  @Column()
  @Index()
  bathroom: number;

  @Column({
    type: 'enum',
    enum: Facility,
    array: true, // Store as an array
  })
  facilities: Facility[];

  @Column({
    type: 'enum',
    enum: PerchTypes,
  })
  type: PerchTypes;

  @Column('text')
  description: string;

  @Column()
  @Index() // Searching properties by location is common
  location: string;

  @Column('decimal')
  price: number;

  @Column('decimal')
  cautionFee: number;

  @Column()
  header: string;

  @Column('simple-array', { nullable: true })
  gallery?: string[];

  @Column({
    type: 'enum',
    enum: ChargeType,
  })
  chargeType: ChargeType;

  @Column('simple-array', { nullable: true })
  checkInPeriods?: string[];

  @Column({ nullable: true })
  checkOutPeriod?: string;

  @Column({
    default: RegistrationStatus.IN_REVIEW,
    type: 'enum',
    enum: RegistrationStatus,
  })
  status: RegistrationStatus;

  @Column('simple-array')
  proofOfIdentity: string[];

  @Column('simple-array')
  proofOfOwnership: string[];

  @Column()
  termsAndConditions: boolean;

  @Column({ nullable: true })
  rating: number;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Category,
  })
  @Index()
  category?: Category | null;

  @ManyToOne(() => User, (user) => user.properties)
  @Index() // Searching properties by host (owner)
  host: User;

  @OneToMany(() => Booking, (booking) => booking.property)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.property)
  reviews: Review[];
}
