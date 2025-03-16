import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './Base.entity';

@Entity('refreshToken')
export class RefreshToken extends BaseEntity {
  @Column({ nullable: false })
  token: string;

  @Column({ nullable: false })
  @Index()
  userId: string;

  @Column()
  expiryDate: Date;
}
