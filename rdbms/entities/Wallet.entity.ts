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

@Entity('wallets')
export class Wallet extends BaseEntity {
  @OneToOne(() => User, (user) => user.wallet)
  user: User;

  @Column('decimal', { default: 0 })
  balance: number;

  @Column()
  bankName: string;

  @Column()
  accountNumber: string;

  @Column()
  accountName: string;

  @OneToMany(() => Payment, (payment) => payment.wallet)
  payments: Payment[];
}
