import { ConflictException, Injectable } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreatedUserObj,
  DeletedUserObj,
  RestoredUserObj,
  UpdatedUserObj,
} from 'src/types';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { RabbitmqService } from './rabbitmq.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  findById(id: number): Promise<User> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOneOrFail();
  }

  async create(payload: CreatedUserObj, context: RmqContext): Promise<User> {
    try {
      let findedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .withDeleted()
        .where('public.user.email = :email', {
          email: payload.createdUser.email,
        })
        .getOne();

      if (findedUser) throw new ConflictException('The user already exist.');

      const newUser = await this.userRepository
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(payload.createdUser)
        .returning('*')
        .exe({ noEffectError: 'Could not create the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return newUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update(payload: UpdatedUserObj, context: RmqContext): Promise<User> {
    try {
      const updatedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .update()
        .set({
          email: payload.updatedUser.email,
          firstName: payload.updatedUser.firstName,
          lastName: payload.updatedUser.lastName,
          password: payload.updatedUser.password,
          phone: payload.updatedUser.phone,
          role: payload.updatedUser.role,
          updatedAt: new Date(payload.updatedUser.updatedAt),
        })
        .where('public.user.id = :userId')
        .setParameters({ userId: payload.updatedUser.id })
        .returning('*')
        .exe({ noEffectError: 'Could not update the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return updatedUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async delete(payload: DeletedUserObj, context: RmqContext): Promise<User> {
    try {
      const deletedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .softDelete()
        .where('public.user.id = :deletedUserId')
        .andWhere('public.user.deleted_at IS NULL')
        .setParameters({ deletedUserId: payload.deletedUser.id })
        .returning('*')
        .exe({ noEffectError: 'Could not delete the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return deletedUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async restore(payload: RestoredUserObj, context: RmqContext): Promise<User> {
    try {
      const restoredUser = await this.userRepository
        .createQueryBuilder('public.user')
        .restore()
        .where('public.user.id = :restoredUserId')
        .andWhere('public.user.deleted_at IS NOT NULL')
        .andWhere('public.user.created_by = :currentUserId')
        .setParameters({
          restoredUserId: payload.restoredUser.id,
          currentUserId: payload.currentUser.id,
        })
        .returning('*')
        .exe({ noEffectError: 'Could not restore the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return restoredUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
