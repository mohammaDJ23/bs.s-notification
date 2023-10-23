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
import { UserRoles } from 'src/types';
import { Brackets, Repository } from 'typeorm';
import { setVapidDetails, sendNotification, RequestOptions } from 'web-push';
import { RabbitmqService } from './rabbitmq.service';
import { Request } from 'express';
import { parse } from 'platform';

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
      .orderBy('user.createdAt', 'DESC')
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

  async sendNotificationToOwners(
    context: RmqContext,
    payload?: string | Buffer | null,
    requestOptions?: RequestOptions,
  ): Promise<void> {
    try {
      this.rabbitmqService.applyAcknowledgment(context);

      payload = payload || JSON.stringify({ title: 'New notification' });
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
