import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageDto, SubscribeDto } from 'src/dtos';
import { User, Notification } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async subscribe(payload: SubscribeDto, user: User): Promise<MessageDto> {
    return { message: 'The subscription was created.' };
  }
}
