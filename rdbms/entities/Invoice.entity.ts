import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './Base.entity';
import { Booking } from './Booking.entity';
import { Payment } from './Payment.entity';

@Entity('invoice')
export class Invoice extends BaseEntity {
  @Column('decimal')
  price: number;

  @Column('decimal')
  subPrice: number;

  @Column('decimal')
  period: number;

  @Column('decimal')
  subTotal: number;

  @Column('decimal')
  hostServiceFee: number;

  @Column('decimal')
  guestServiceFee: number;

  @Column('decimal')
  cautionFee: number;

  @Column('decimal')
  guestTotal: number;

  @Column('decimal')
  hostTotal: number;

  @OneToOne(() => Booking, (booking) => booking.invoice)
  booking: Booking;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}
