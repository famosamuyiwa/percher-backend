import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { User } from 'rdbms/entities/User.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'rdbms/entities/Wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, User])],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
