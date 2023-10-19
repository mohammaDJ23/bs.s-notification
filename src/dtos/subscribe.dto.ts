import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsNotEmptyObject,
  IsDefined,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SubscribeKeysDto {
  @IsString()
  @ApiProperty()
  p256dh: string;

  @IsString()
  @ApiProperty()
  auth: string;
}

export class SubscribeDto {
  @IsString()
  @ApiProperty()
  endpoint: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  expirationTime: number | null;

  @IsNumber()
  @ApiProperty()
  userId: number;

  @IsObject()
  @IsNotEmptyObject()
  @IsDefined()
  @ValidateNested()
  @Type(() => SubscribeKeysDto)
  @ApiProperty()
  keys: SubscribeKeysDto;

  @IsString()
  @ApiProperty()
  visitorId: string;
}
