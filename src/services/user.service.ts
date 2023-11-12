import { ConflictException, Injectable } from '@nestjs/common';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
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

  async create(context: RmqContext, payload: User, user: User): Promise<User> {
    try {
      let findedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .withDeleted()
        .where('public.user.email = :email', { email: payload.email })
        .getOne();

      if (findedUser) throw new ConflictException('The user already exist.');

      const newUser = await this.userRepository
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(payload)
        .returning('*')
        .exe({ noEffectError: 'Could not create the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return newUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update(context: RmqContext, payload: User, user: User): Promise<User> {
    try {
      const newUser = this.userRepository.create(payload);
      const updatedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .update()
        .set(newUser)
        .where('public.user.id = :id')
        .setParameters({ id: payload.id })
        .returning('*')
        .exe({ noEffectError: 'Could not update the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return updatedUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async delete(context: RmqContext, payload: User, user: User): Promise<User> {
    try {
      const deletedUser = await this.userRepository
        .createQueryBuilder('public.user')
        .softDelete()
        .where('public.user.id = :id')
        .andWhere('public.user.deleted_at IS NULL')
        .setParameters({ id: payload.id })
        .returning('*')
        .exe({ noEffectError: 'Could not delete the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return deletedUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async restore(context: RmqContext, payload: User, user: User): Promise<User> {
    try {
      const restoredUser = await this.userRepository
        .createQueryBuilder('public.user')
        .restore()
        .where('public.user.id = :id')
        .andWhere('public.user.deleted_at IS NOT NULL')
        .setParameters({ id: payload.id })
        .returning('*')
        .exe({ noEffectError: 'Could not restore the user.' });
      this.rabbitmqService.applyAcknowledgment(context);
      return restoredUser;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
