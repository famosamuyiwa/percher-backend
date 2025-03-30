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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hostServiceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  guestServiceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cautionFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  guestTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hostTotal: number;

  @OneToOne(() => Booking, (booking) => booking.invoice)
  booking: Booking;

  @OneToMany(() => Payment, (payment) => payment.invoice, {
    cascade: true,
  })
  payments: Payment[];
}
