import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from 'rdbms/entities/Property.entity';
import { User } from 'rdbms/entities/User.entity';
import { GlobalUtilService } from 'src/global-utils';
import { MediaUpload } from 'rdbms/entities/MediaUpload';

@Module({
  imports: [TypeOrmModule.forFeature([Property, User, MediaUpload])],
  controllers: [PropertyController],
  providers: [PropertyService, GlobalUtilService],
  exports: [PropertyService],
})
export class PropertyModule {}
