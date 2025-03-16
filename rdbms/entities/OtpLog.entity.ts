import { Entity, Column } from 'typeorm';
import { BaseEntity } from './Base.entity';

@Entity('otp_log')
export class OtpLog extends BaseEntity {
  @Column()
  configLength: string;

  @Column()
  token: string;

  @Column()
  email: string;

  @Column()
  lifetime: Date;

  @Column()
  isDeactivated: boolean;
}
