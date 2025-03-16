import { Entity, Column, OneToMany, ManyToOne, Index, OneToOne } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { Booking } from './Booking.entity';
import { Property } from './Property.entity';
import { Wallet } from './Wallet.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @Index() // Users will frequently be queried by email
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column()
  name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @ManyToOne(() => User, (user) => user.referredUsers, { nullable: true })
  referredBy?: User;

  @OneToMany(() => User, (user) => user.referredBy)
  referredUsers?: User[];

  @Column()
  referralCode: string;

  @Column({ default: 0 })
  referralPoints: number;

  @Column({ default: 0 })
  referralCount: number;

  @OneToMany(() => Property, (property) => property.host)
  properties: Property[];

  @OneToMany(() => Booking, (booking) => booking.guest)
  guestBookings: Booking[];

  @OneToMany(() => Booking, (booking) => booking.host)
  hostBookings: Booking[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;
}
