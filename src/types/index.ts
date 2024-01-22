import { Request as Req } from 'express';
import { User } from 'src/entities';
import { RequestOptions } from 'web-push';
import { FieldValue } from '@google-cloud/firestore';

export interface CurrentUserObj {
  currentUser: User;
}

export interface UserObj {
  user: User;
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

export type ListObj = [any[], number];

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

export interface CreatedUserObj extends UserObj {
  payload: User;
}

export interface UpdatedUserObj extends UserObj {
  payload: User;
}

export interface DeletedUserObj extends UserObj {
  payload: User;
}

export interface RestoredUserObj extends UserObj {
  payload: User;
}

export interface NotificationPayloadObj<T = {}> extends UserObj {
  payload: {
    data: T;
    options?: RequestOptions;
  };
}

export enum MessageStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface MessageObj {
  id: string;
  userId: number;
  text: string;
  isReaded: boolean;
  status: MessageStatus;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  deletedAt: FieldValue | null;
}
