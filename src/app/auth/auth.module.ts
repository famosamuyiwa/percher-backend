import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'rdbms/entities/User.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpLog } from 'rdbms/entities/OtpLog.entity';
import { RefreshToken } from 'rdbms/entities/RefreshToken.entity';
import { Wallet } from 'rdbms/entities/Wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, OtpLog, RefreshToken, Wallet])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
