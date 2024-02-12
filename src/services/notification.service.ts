import { Injectable } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MessageDto,
  SubscribeDto,
  UnsubscribeDto,
  NotificationListFiltersDto,
} from 'src/dtos';
import { User, Notification } from 'src/entities';
import { MessageObj, UserObj, UserRoles } from 'src/types';
import { Brackets, Repository } from 'typeorm';
import { setVapidDetails, sendNotification } from 'web-push';
import { RabbitmqService } from './rabbitmq.service';
import { Request } from 'express';
import { parse } from 'platform';

export interface CreatedUserPayloadObj extends UserObj {}

export interface CreatedMessagePayloadObj extends UserObj {
  message: MessageObj;
  targetUser: User;
}

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

  async subscribe(
    payload: SubscribeDto,
    user: User,
    request: Request,
  ): Promise<MessageDto> {
    const platform = parse(request.headers['user-agent']);
    const subscription = this.notificationRepository.create({
      endpoint: payload.endpoint,
      expirationTime: payload.expirationTime,
      visitorId: payload.visitorId,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      deviceDescription: platform.description,
      userAgent: platform.ua,
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

  async unsubscribe(payload: UnsubscribeDto, user: User): Promise<MessageDto> {
    const result = await this.notificationRepository
      .createQueryBuilder('notification')
      .delete()
      .where('notification.user_id = :userId')
      .andWhere('notification.visitor_id = :visitorId')
      .setParameters({
        userId: user.id,
        visitorId: payload.visitorId,
      })
      .execute();
    if (result.affected) {
      return { message: 'The notification was deleted.' };
    }
    return { message: 'No notification was deleted.' };
  }

  findAll(
    page: number,
    take: number,
    filters: NotificationListFiltersDto,
  ): Promise<[Notification[], number]> {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .take(take)
      .skip((page - 1) * take)
      .orderBy('notification.createdAt', 'DESC')
      .leftJoinAndSelect('notification.user', 'user')
      .where(
        new Brackets((query) =>
          query
            .where(
              'to_tsvector(notification.deviceDescription) @@ plainto_tsquery(:q)',
            )
            .orWhere('to_tsvector(user.first_name) @@ plainto_tsquery(:q)')
            .orWhere('to_tsvector(user.last_name) @@ plainto_tsquery(:q)')
            .orWhere("notification.deviceDescription ILIKE '%' || :q || '%'")
            .orWhere("user.first_name ILIKE '%' || :q || '%'")
            .orWhere("user.last_name ILIKE '%' || :q || '%'"),
        ),
      )
      .andWhere('user.role = ANY(:roles)')
      .andWhere(
        'CASE WHEN (:fromDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(notification.createdAt)) * 1000, 0)::BIGINT >= (:fromDate)::BIGINT ELSE TRUE END',
      )
      .andWhere(
        'CASE WHEN (:toDate)::BIGINT > 0 THEN COALESCE(EXTRACT(EPOCH FROM date(notification.createdAt)) * 1000, 0)::BIGINT <= (:toDate)::BIGINT ELSE TRUE END',
      )
      .setParameters({
        q: filters.q,
        roles: filters.roles,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      })
      .getManyAndCount();
  }

  findByIdOrFail(id: number): Promise<Notification> {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .where('notification.id = :id')
      .setParameters({ id })
      .getOneOrFail();
  }

  async createdUserNotification(
    context: RmqContext,
    payload: CreatedUserPayloadObj,
    user: User,
  ): Promise<void> {
    try {
      this.rabbitmqService.applyAcknowledgment(context);

      const notifications = await this.notificationRepository
        .createQueryBuilder('notification')
        .leftJoin('notification.user', 'user')
        .where('user.role = :userRole')
        .setParameters({ userRole: UserRoles.OWNER })
        .getMany();

      const pushSubscriptionRequests = notifications.map((notification) => {
        return sendNotification(
          {
            endpoint: notification.endpoint,
            keys: {
              p256dh: notification.p256dh,
              auth: notification.auth,
            },
          },
          JSON.stringify(
            Object.assign(payload, {
              type: 'created_user',
              title: 'A new user was created.',
            }),
          ),
        );
      });
      await Promise.all(pushSubscriptionRequests);
    } catch (error) {
      console.error(error);
    }
  }

  async createdMessageNotification(
    context: RmqContext,
    payload: CreatedMessagePayloadObj,
    user: User,
  ): Promise<void> {
    try {
      this.rabbitmqService.applyAcknowledgment(context);

      const notifications = await this.notificationRepository
        .createQueryBuilder('notification')
        .leftJoin('notification.user', 'user')
        .where('user.id = :id')
        .setParameters({ id: payload.targetUser.id })
        .getMany();

      const pushSubscriptionRequests = notifications.map((notification) => {
        return sendNotification(
          {
            endpoint: notification.endpoint,
            keys: {
              p256dh: notification.p256dh,
              auth: notification.auth,
            },
          },
          JSON.stringify(
            Object.assign(payload, {
              type: 'created_message',
              title: 'A new message was created.',
            }),
          ),
        );
      });
      await Promise.all(pushSubscriptionRequests);
    } catch (error) {
      console.error(error);
    }
  }
}
