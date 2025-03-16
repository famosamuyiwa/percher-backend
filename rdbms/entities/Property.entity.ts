import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { User } from './User.entity';
import { Booking } from './Booking.entity';
import { BaseEntity } from './Base.entity';
import { Review } from './Review.entity';

@Entity('properties')
export class Property extends BaseEntity {
  @Column()
  @Index() // Quick searches based on title
  title: string;

  @Column('text')
  description: string;

  @Column()
  @Index() // Searching properties by location is common
  location: string;

  @Column('decimal')
  pricePerNight: number;

  @Column('simple-array')
  images: string[];

  @Column({ default: true })
  availability: boolean;

  @ManyToOne(() => User, (user) => user.properties)
  @Index() // Searching properties by host (owner)
  host: User;

  @OneToMany(() => Booking, (booking) => booking.property)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.property)
  reviews: Review[];
}
