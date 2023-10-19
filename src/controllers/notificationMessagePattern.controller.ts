import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { User } from 'src/entities';
import { UserService } from 'src/services';
import {
  CreatedUserObj,
  DeletedUserObj,
  RestoredUserObj,
  UpdatedUserObj,
} from 'src/types';

@Controller('/message-patterns/v1/notification')
export class NotificationMessagePatternController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('created_user')
  create(
    @Payload() payload: CreatedUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.create(payload, context);
  }

  @MessagePattern('updated_user')
  update(
    @Payload() payload: UpdatedUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.update(payload, context);
  }

  @MessagePattern('deleted_user')
  delete(
    @Payload() payload: DeletedUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.delete(payload, context);
  }

  @MessagePattern('restored_user')
  restore(
    @Payload() payload: RestoredUserObj,
    @Ctx() context: RmqContext,
  ): Promise<User> {
    return this.userService.restore(payload, context);
  }
}
