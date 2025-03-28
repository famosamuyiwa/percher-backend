import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Wallet } from './Wallet.entity';
import { BaseEntity } from './Base.entity';
import { Invoice } from './Invoice.entity';
import { PaymentStatus, TransactionType } from 'enums';

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => Wallet, (wallet) => wallet.payments)
  @Index() // Wallet transactions should be quickly retrievable
  wallet: Wallet;

  @Column('decimal')
  amount: number;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.OTHER,
  })
  type: TransactionType;

  @Column({ type: 'enum', enum: PaymentStatus })
  @Index() // Checking transaction status frequently
  status: PaymentStatus;

  @Column()
  @Index({ unique: true }) // Reference ID should be unique
  reference: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  invoice: Invoice;
}
