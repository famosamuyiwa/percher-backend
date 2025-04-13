import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaUpload } from 'rdbms/entities/MediaUpload';

@Module({
  imports: [TypeOrmModule.forFeature([MediaUpload])],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
