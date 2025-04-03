import 'reflect-metadata';
import { DataSource } from 'typeorm';
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
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase',
  entities: [
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
  ],
  migrations: ['dist/migrations/*.js'], // Ensure compiled JS migrations are used
  synchronize: false,
  logging: ['error', 'warn', 'migration'], // Helps with debugging migrations
});
