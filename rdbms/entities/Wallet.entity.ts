import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './Base.entity';
import { Payment } from './Payment.entity';
import { Transaction } from './Transaction.entity';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @OneToOne(() => User, (user) => user.wallet)
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ nullable: true })
  bankName?: string;

  @Column({ nullable: true })
  accountNumber?: string;

  @Column({ nullable: true })
  accountName?: string;

  @Column({ nullable: true })
  bankCode?: string;

  @Column({ nullable: true })
  bankLogo?: string;

  @OneToMany(() => Payment, (payment) => payment.wallet)
  payments: Payment[];

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
