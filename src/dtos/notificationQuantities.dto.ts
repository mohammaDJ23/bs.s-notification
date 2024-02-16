import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NotificationQuantitiesDto {
  @Expose()
  @ApiProperty()
  quantities: string;
}
