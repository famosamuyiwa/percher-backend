import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { MediaUploadType, MediaEntityType } from 'enums';

export class CreateUploadDto {
  @IsNotEmpty()
  @IsEnum(MediaUploadType)
  mediaType: MediaUploadType;

  @IsNotEmpty()
  @IsEnum(MediaEntityType)
  mediaEntityType: MediaEntityType;

  @IsNotEmpty()
  @IsNumber()
  mediaEntityTypeId: number;

  @IsNotEmpty()
  @IsString()
  mediaUrl: string;
}
