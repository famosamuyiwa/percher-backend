import { Entity, Column, ManyToOne, Index, OneToMany } from 'typeorm';
import { Wallet } from './Wallet.entity';
import { BaseEntity } from './Base.entity';
import { Invoice } from './Invoice.entity';
import { PaymentStatus, PaymentType, TransactionType } from 'enums';
import { Transaction } from './Transaction.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => Wallet, (wallet) => wallet.payments, { cascade: true })
  @Index()
  wallet: Wallet;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.DRAFT,
  })
  type: PaymentType;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.OTHER,
  })
  transactionType: TransactionType;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Index() // Checking payment status frequently
  status: PaymentStatus;

  @Column()
  @Index({ unique: true }) // Reference ID should be unique
  reference: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  invoice: Invoice;

  @OneToMany(() => Transaction, (transaction) => transaction.payment)
  transactions: Transaction[];
}
