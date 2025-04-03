import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PropertyModule } from './app/property/property.module';
import { BookingModule } from './app/booking/booking.module';
import { PaymentModule } from './app/payment/payment.module';
import { IpWhitelistMiddleware } from './middleware';
import { WalletModule } from './app/wallet/wallet.module';
import { NotificationModule } from './app/notification/notification.module';
import { CronModule } from './cron/cron.module';
import { entities, migrations } from './config/database.config';

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
        url: configService.get<string>('DATABASE_URL'),
        entities,
        migrations,
        synchronize: false, // Ensure this is FALSE when using migrations
      }),
    }),
    AuthModule,
    UserModule,
    PropertyModule,
    BookingModule,
    PaymentModule,
    WalletModule,
    NotificationModule,
    CronModule,
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
