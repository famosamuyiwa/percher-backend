import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
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
  @IsOptional()
  header?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  cautionFee: number;

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

  // location
  @IsString()
  @IsNotEmpty()
  latitude: string;

  @IsString()
  @IsNotEmpty()
  longitude: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @IsNumber()
  @IsNotEmpty()
  propertyNumber: number;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  snapshot?: string;

  @IsArray()
  @IsOptional()
  proofOfIdentity?: string[];

  @IsArray()
  @IsOptional()
  gallery?: string[];

  @IsArray()
  @IsOptional()
  proofOfOwnership?: string[];
}
