import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { User } from './User.entity';
import { NotificationStatus, NotificationType } from 'enums';

@Entity('notifications')
export class Notification extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notifications)
  @Index()
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  @Index()
  status: NotificationStatus;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any> | null;
}
