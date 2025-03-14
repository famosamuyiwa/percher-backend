import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppwriteModule } from './appwrite/appwrite.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { User } from 'rdbms/entities/User.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Kay80704080.',
      database: 'percher',
      entities: [User],
      synchronize: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available throughout the app
    }),
    AppwriteModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
