import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { Payment } from './Payment.entity';
import { Wallet } from './Wallet.entity';
import { TransactionMode, TransactionStatus, TransactionType } from 'enums';
import { BaseEntity } from './Base.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @ManyToOne(() => Payment, (payment) => payment.transactions)
  @Index()
  payment: Payment;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @Index()
  wallet: Wallet;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.OTHER,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionMode,
    nullable: true,
  })
  @Index()
  mode: TransactionMode | null;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    nullable: true,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  description: string;
}
