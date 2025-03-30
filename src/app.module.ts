import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { User } from 'rdbms/entities/User.entity';
import { Property } from 'rdbms/entities/Property.entity';
import { Review } from 'rdbms/entities/Review.entity';
import { Wallet } from 'rdbms/entities/Wallet.entity';
import { Booking } from 'rdbms/entities/Booking.entity';
import { UserModule } from './user/user.module';
import { OtpLog } from 'rdbms/entities/OtpLog.entity';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from 'rdbms/entities/RefreshToken.entity';
import { PropertyModule } from './property/property.module';
import { BookingModule } from './booking/booking.module';
import { Invoice } from 'rdbms/entities/Invoice.entity';
import { PaymentModule } from './payment/payment.module';
import { Payment } from 'rdbms/entities/Payment.entity';
import { IpWhitelistMiddleware } from './middleware';
import { Transaction } from 'rdbms/entities/Transaction.entity';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available throughout the app
      cache: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
      global: true,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'mydatabase'),
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
        ],
        migrations: ['dist/migrations/*.js'], // Use compiled migrations
        synchronize: true, // Ensure this is FALSE when using migrations
      }),
    }),
    AuthModule,
    UserModule,
    PropertyModule,
    BookingModule,
    PaymentModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    //protect webhook endpoint from unauthorized IPs
    consumer.apply(IpWhitelistMiddleware).forRoutes('/payment/webhook');
  }
}
