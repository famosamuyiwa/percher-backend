import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Index,
  PrimaryColumn,
} from 'typeorm';
// import { Booking } from './booking.entity';
// import { Property } from './property.entity';
// import { Wallet } from './wallet.entity';
// import { Referral } from './referral.entity';
// import { BankAccount } from './bankAccount.entity';

@Entity('users')
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  @Index() // Users will frequently be queried by email
  email: string;

  @Column()
  name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ type: 'enum', enum: ['guest', 'host', 'admin'], default: 'guest' })
  role?: string;

  @ManyToOne(() => User, (user) => user.referredUsers, { nullable: true })
  referredBy?: User;

  @OneToMany(() => User, (user) => user.referredBy)
  referredUsers?: User[];

  // @OneToMany(() => Property, (property) => property.host)
  // properties: Property[];

  // @OneToMany(() => Booking, (booking) => booking.guest)
  // guestBookings: Booking[];

  // @OneToMany(() => Booking, (booking) => booking.host)
  // hostBookings: Booking[];

  // @OneToMany(() => Referral, (referral) => referral.referrer)
  // referrals: Referral[];

  // @OneToMany(() => BankAccount, (bank) => bank.user)
  // bankAccounts: BankAccount[];

  // @OneToMany(() => Wallet, (wallet) => wallet.user)
  // wallet: Wallet;
}
