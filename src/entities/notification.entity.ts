import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../entities';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'bigint', nullable: true })
  expirationTime: number;

  @Column({ type: 'text' })
  visitorId: string;

  @Column({ type: 'text' })
  p256dh: string;

  @Column({ type: 'text' })
  auth: string;

  @Column({ type: 'text', nullable: true })
  deviceDescription: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.notification)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}
