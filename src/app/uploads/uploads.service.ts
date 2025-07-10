import { Injectable } from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaUpload } from 'rdbms/entities/MediaUpload';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { getEnvVariable } from 'utils/helper-methods';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(MediaUpload)
    private readonly mediaUploadRepository: Repository<MediaUpload>,
    private readonly configService: ConfigService,
  ) {}

  create(createUploadDto: CreateUploadDto, userId: number) {
    const mediaUpload = this.mediaUploadRepository.create({
      ...createUploadDto,
      user: { id: userId },
    });
    return this.mediaUploadRepository.save(mediaUpload);
  }

  async getPresignedUrl(key: string) {
    const s3 = new S3Client({
      endpoint: getEnvVariable('CLOUDFLARE_ENDPOINT'),
      credentials: {
        accessKeyId: getEnvVariable('S3_ACCESS_KEY'),
        secretAccessKey: getEnvVariable('S3_SECRET_KEY'),
      },
      region: 'auto',
    });
    const command = new PutObjectCommand({
      Bucket: getEnvVariable('S3_BUCKET_NAME'),
      Key: key,
      ContentType: 'application/octet-stream',
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  }
  findAll() {
    return `This action returns all uploads`;
  }

  findOne(id: number) {
    return `This action returns a #${id} upload`;
  }

  update(id: number, updateUploadDto: UpdateUploadDto) {
    return `This action updates a #${id} upload`;
  }

  remove(id: number) {
    return `This action removes a #${id} upload`;
  }
}
