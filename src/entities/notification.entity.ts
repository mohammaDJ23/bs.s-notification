import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from '../entities';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  endpoint: string;

  @Column({ type: 'bigint', nullable: true })
  expirationTime: number;

  @Column({ type: 'varchar' })
  visitorId: string;

  @Column({ type: 'varchar' })
  p256dh: string;

  @Column({ type: 'varchar' })
  auth: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.notification, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userServiceId' })
  user: User;
}
