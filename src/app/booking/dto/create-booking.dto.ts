import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChargeType } from 'enums';
import { Invoice } from 'rdbms/entities/Invoice.entity';
import { Property } from 'rdbms/entities/Property.entity';
import { User } from 'rdbms/entities/User.entity';

export class CreateBookingDto {
  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsString()
  @IsOptional()
  checkIn?: string;

  @IsString()
  @IsOptional()
  checkOut?: string;

  @IsString()
  @IsNotEmpty()
  chargeType: ChargeType;

  @IsNumber()
  @IsNotEmpty()
  propertyId: Property;

  @IsNumber()
  @IsNotEmpty()
  hostId: User;

  @IsNotEmpty()
  invoice: Invoice;
}
