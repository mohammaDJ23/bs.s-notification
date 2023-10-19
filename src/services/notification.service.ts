import { Injectable } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageDto, SubscribeDto } from 'src/dtos';
import { User, Notification } from 'src/entities';
import { UserRoles } from 'src/types';
import { Repository } from 'typeorm';
import { setVapidDetails, sendNotification, RequestOptions } from 'web-push';
import { RabbitmqService } from './rabbitmq.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly rabbitmqService: RabbitmqService,
  ) {
    setVapidDetails(
      `mailto:${process.env.VAPID_SUBJECT}`,
      process.env.VAPID_PUBLICK_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }

  async subscribe(payload: SubscribeDto, user: User): Promise<MessageDto> {
    const subscription = this.notificationRepository.create({
      endpoint: payload.endpoint,
      expirationTime: payload.expirationTime,
      visitorId: payload.visitorId,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
    });
    subscription.user = user;

    const findedSubscription = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.visitorId = :visitorId')
      .setParameters({ visitorId: payload.visitorId })
      .getOne();

    if (findedSubscription) {
      await this.notificationRepository
        .createQueryBuilder('notification')
        .update()
        .set(subscription)
        .where('notification.visitor_id = :visitorId')
        .setParameters({ visitorId: payload.visitorId })
        .execute();
    } else {
      await this.notificationRepository
        .createQueryBuilder()
        .insert()
        .into(Notification)
        .values(subscription)
        .execute();
    }

    return { message: 'The subscription was created.' };
  }

  async sendNotificationToOwners(
    context: RmqContext,
    payload?: string,
    requestOptions?: RequestOptions,
  ): Promise<void> {
    try {
      this.rabbitmqService.applyAcknowledgment(context);

      payload = payload || 'New notification';
      requestOptions = requestOptions || {};

      const owners = await this.notificationRepository
        .createQueryBuilder('notification')
        .leftJoin('notification.user', 'user')
        .where('user.role = :userRole')
        .setParameters({ userRole: UserRoles.OWNER })
        .getMany();

      const pushSubscriptionRequests = owners.map((owner) => {
        return sendNotification(
          {
            endpoint: owner.endpoint,
            keys: {
              p256dh: owner.p256dh,
              auth: owner.auth,
            },
          },
          payload,
          requestOptions,
        );
      });
      await Promise.all(pushSubscriptionRequests);
    } catch (error) {
      console.error(error);
    }
  }
}
