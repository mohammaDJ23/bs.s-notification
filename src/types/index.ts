import { Request as Req } from 'express';
import { User } from 'src/entities';
import { RequestOptions } from 'web-push';

export interface CurrentUserObj {
  currentUser: User;
}

export interface Request extends Req, CurrentUserObj {
  user: User;
}

export type Exception =
  | {
      message: string;
      statusCode: number;
      error: string;
    }
  | string;

export interface ClassConstructor {
  new (...args: any[]): {};
}

export interface DtoConstructor {
  readonly construct: ClassConstructor;
}

export class SerialConstructor implements DtoConstructor {
  constructor(readonly construct: ClassConstructor) {}
}

export class ListSerial extends SerialConstructor {}

export class ArraySerial extends SerialConstructor {}

export class ObjectSerial extends SerialConstructor {}

export interface EncryptedUserObj {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  expiration: number;
}

export enum UserRoles {
  OWNER = 'owner',
  ADMIN = 'admin',
  USER = 'user',
}

export interface CreatedUserObj extends CurrentUserObj {
  createdUser: User;
}

export interface UpdatedUserObj extends CurrentUserObj {
  updatedUser: User;
}

export interface DeletedUserObj extends CurrentUserObj {
  deletedUser: User;
}

export interface RestoredUserObj extends CurrentUserObj {
  restoredUser: User;
}

export interface NotificationObj {
  payload?: Buffer | string | null;
  requestOptions?: RequestOptions;
}
