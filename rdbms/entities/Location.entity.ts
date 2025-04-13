import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { Property } from './Property.entity';

@Entity('location')
export class Location extends BaseEntity {
  @OneToOne(() => Property, (property) => property.location)
  property: Property;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  streetAddress: string;

  @Column({ nullable: true })
  propertyNumber: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @Column({ nullable: true })
  snapshotUrl?: string;
}
