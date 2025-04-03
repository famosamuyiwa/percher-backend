import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChargeType, Facility, PerchTypes } from 'enums';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  propertyName: string;

  @IsString()
  @IsNotEmpty()
  propertyType: PerchTypes;

  @IsString()
  @IsNotEmpty()
  chargeType: ChargeType;

  @IsNumber()
  @IsNotEmpty()
  beds: number;

  @IsNumber()
  @IsNotEmpty()
  bathrooms: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  header: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  cautionFee: number;

  @IsArray()
  @IsOptional()
  gallery?: string[];

  @IsArray()
  @IsNotEmpty()
  proofOfOwnership: string[];

  @IsArray()
  @IsNotEmpty()
  proofOfIdentity: string[];

  @IsBoolean()
  @IsNotEmpty()
  txc: boolean;

  @IsArray()
  @IsNotEmpty()
  facilities: Facility[];

  @IsArray()
  @IsOptional()
  checkInTimes?: string[];

  @IsString()
  @IsOptional()
  checkOutTime?: string;
}
