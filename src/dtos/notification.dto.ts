import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class NotificationDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  endpoint: string;

  @Expose()
  @ApiProperty()
  expirationTime: number;

  @Expose()
  @ApiProperty()
  visitorId: string;

  @Expose()
  @ApiProperty()
  p256dh: string;

  @Expose()
  @ApiProperty()
  auth: string;

  @Expose()
  @ApiProperty()
  deviceDescription: string;

  @Expose()
  @ApiProperty()
  userAgent: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiProperty()
  userId: number;

  @Expose()
  @ApiProperty()
  @Type(() => UserDto)
  user: UserDto;
}
