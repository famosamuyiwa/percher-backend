import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './Base.entity';
import { User } from './User.entity';
import { MediaEntityType, MediaUploadType } from 'enums';

@Entity('media_uploads')
export class MediaUpload extends BaseEntity {
  @ManyToOne(() => User, (user) => user.mediaUploads, {
    nullable: false,
  })
  user: User;

  @Column({
    type: 'enum',
    enum: MediaUploadType,
    nullable: false,
  })
  mediaType: MediaUploadType;

  @Column({
    type: 'enum',
    enum: MediaEntityType,
    nullable: false,
  })
  mediaEntityType: MediaEntityType;

  @Column({ nullable: false })
  mediaEntityTypeId: number;

  @Column({ nullable: false })
  mediaUrl: string;
}
