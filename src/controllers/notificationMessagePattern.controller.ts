import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { User } from 'src/entities';
import {
  CreatedMessagePayloadObj,
  CreatedUserPayloadObj,
  NotificationService,
  UserService,
} from 'src/services';
import {
  CreatedUserObj,
  DeletedUserObj,
  NotificationPayloadObj,
  RestoredUserObj,
  UpdatedUserObj,
} from 'src/types';

@Controller('/message-patterns/v1/notification')
export class NotificationMessagePatternController {
  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  @MessagePattern('created_user')
  create(
    @Payload() payload: CreatedUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.create(context, payload.payload, payload.user);
  }

  @MessagePattern('updated_user')
  update(
    @Payload() payload: UpdatedUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.update(context, payload.payload, payload.user);
  }

  @MessagePattern('deleted_user')
  delete(
    @Payload() payload: DeletedUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.delete(context, payload.payload, payload.user);
  }

  @MessagePattern('restored_user')
  restore(
    @Payload() payload: RestoredUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.restore(context, payload.payload, payload.user);
  }

  @EventPattern('created_user_notification')
  createdUserNotification(
    @Payload() payload: NotificationPayloadObj<CreatedUserPayloadObj>,
    @Ctx() context: RmqContext,
  ): void {
    this.notificationService.createdUserNotification(
      context,
      payload.payload.data,
      payload.user,
    );
  }

  @EventPattern('created_message_notification')
  createdMessageNotification(
    @Payload() payload: NotificationPayloadObj<CreatedMessagePayloadObj>,
    @Ctx() context: RmqContext,
  ): void {
    this.notificationService.createdMessageNotification(
      context,
      payload.payload.data,
      payload.user,
    );
  }
}
