import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User.entity';
import { Property } from './Property.entity';
import { BaseEntity } from './Base.entity';

@Entity('reviews')
export class Review extends BaseEntity {
  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Property, (property) => property.reviews)
  property: Property;

  @Column({ type: 'int', width: 1 })
  rating: number;

  @Column('text')
  comment: string;
}
