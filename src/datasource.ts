import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../rdbms/entities/User.entity';
import { Property } from '../rdbms/entities/Property.entity';
import { Review } from '../rdbms/entities/Review.entity';
import { Wallet } from '../rdbms/entities/Wallet.entity';
import { Booking } from '../rdbms/entities/Booking.entity';
import { OtpLog } from 'rdbms/entities/OtpLog.entity';
import { RefreshToken } from 'rdbms/entities/RefreshToken.entity';
import { Invoice } from 'rdbms/entities/Invoice.entity';
import { Payment } from 'rdbms/entities/Payment.entity';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'password'),
  database: configService.get('DB_NAME', 'mydatabase'),
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
  ],
  migrations: ['dist/migrations/*.ts'], // Use compiled migrations
  synchronize: false, // Ensure this is FALSE when using migrations. Set to true only for development
});
