import { Entity, Column } from 'typeorm';
import { BaseEntity } from './Base.entity';

@Entity('waitlist')
export class Waitlist extends BaseEntity {
  @Column({ unique: true })
  email: string;
}
