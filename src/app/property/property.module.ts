import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from 'rdbms/entities/Property.entity';
import { User } from 'rdbms/entities/User.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Property, User])],
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}
