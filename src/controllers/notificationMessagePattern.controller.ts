import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { User } from 'src/entities';
import { NotificationService, UserService } from 'src/services';
import {
  CreatedUserObj,
  DeletedUserObj,
  NotificationObj,
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

  @EventPattern('notification_to_owners')
  sendNotificationToOwners(
    @Payload() payload: NotificationObj,
    @Ctx() context: RmqContext,
  ): void {
    this.notificationService.sendNotificationToOwners(
      context,
      payload.user,
      payload.payload.data,
      payload.payload.options,
    );
  }
}
