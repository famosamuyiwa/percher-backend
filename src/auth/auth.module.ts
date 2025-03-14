import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'rdbms/entities/User.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppwriteService } from 'src/appwrite/appwrite.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthService, AppwriteService],
  controllers: [AuthController],
})
export class AuthModule {}
