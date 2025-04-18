import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserPushTokenDto {
  @IsString()
  @IsOptional()
  expoPushToken?: string;
}
