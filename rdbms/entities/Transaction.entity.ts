import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Wallet } from './Wallet.entity';
import { BaseEntity } from './Base.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @Index() // Wallet transactions should be quickly retrievable
  wallet: Wallet;

  @Column('decimal')
  amount: number;

  @Column({
    type: 'enum',
    enum: ['deposit', 'withdrawal', 'booking_payment', 'refund'],
  })
  type: string;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'failed'] })
  @Index() // Checking transaction status frequently
  status: string;

  @Column()
  @Index({ unique: true }) // Reference ID should be unique
  reference: string;
}
