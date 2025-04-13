import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaEntityType, MediaUploadType } from 'enums';
import { MediaUpload } from 'rdbms/entities/MediaUpload';
import { Repository } from 'typeorm';
import { getFilteredPropertyMedia } from 'utils/helper-methods';

@Injectable()
export class GlobalUtilService {
  constructor(
    @InjectRepository(MediaUpload)
    private readonly mediaUploadRepository: Repository<MediaUpload>,
  ) {}

  async getMediaUploads(
    mediaEntityTypeId: number,
    mediaEntityType: MediaEntityType,
    userId: number,
    mediaTypes: MediaUploadType[],
  ) {
    try {
      const mediaUploads = await this.mediaUploadRepository
        .createQueryBuilder('mediaUploads')
        .where('mediaUploads.mediaEntityTypeId = :mediaEntityTypeId', {
          mediaEntityTypeId,
        })
        .andWhere('mediaUploads.mediaEntityType = :mediaEntityType', {
          mediaEntityType,
        })
        .andWhere('mediaUploads.user = :userId', { userId })
        .andWhere('mediaUploads.mediaType in (:...mediaTypes)', { mediaTypes })
        .getMany();

      switch (mediaEntityType) {
        case MediaEntityType.PROPERTY:
          return getFilteredPropertyMedia(mediaUploads);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
