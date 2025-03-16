import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Transaction } from './Transaction.entity';
import { BaseEntity } from './Base.entity';

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

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
