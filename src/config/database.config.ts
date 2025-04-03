import { User } from 'rdbms/entities/User.entity';
import { Property } from 'rdbms/entities/Property.entity';
import { Review } from 'rdbms/entities/Review.entity';
import { Wallet } from 'rdbms/entities/Wallet.entity';
import { Booking } from 'rdbms/entities/Booking.entity';
import { OtpLog } from 'rdbms/entities/OtpLog.entity';
import { RefreshToken } from 'rdbms/entities/RefreshToken.entity';
import { Invoice } from 'rdbms/entities/Invoice.entity';
import { Payment } from 'rdbms/entities/Payment.entity';
import { Transaction } from 'rdbms/entities/Transaction.entity';
import { Notification } from 'rdbms/entities/Notification.entity';

export const entities = [
  User,
  Property,
  Review,
  Payment,
  Wallet,
  Booking,
  OtpLog,
  RefreshToken,
  Invoice,
  Transaction,
  Notification,
];

export const migrations = ['dist/migrations/*.js'];
