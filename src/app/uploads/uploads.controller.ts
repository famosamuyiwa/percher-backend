import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';
import { getEnvVariable } from 'utils/helper-methods';
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  create(@Body() createUploadDto: CreateUploadDto, @Request() req) {
    const loggedInUser = req.userId;
    return this.uploadsService.create(createUploadDto, loggedInUser);
  }

  @Get('/r2/presign')
  async getPresignedUrl(@Query('key') key: string) {
    const uploadUrl = await this.uploadsService.getPresignedUrl(key);
    const fileUrl = `${getEnvVariable('R2_PUBLIC_URL')}/${key}`;
    return { uploadUrl, fileUrl };
  }

  @Get()
  findAll() {
    return this.uploadsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUploadDto: UpdateUploadDto) {
    return this.uploadsService.update(+id, updateUploadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadsService.remove(+id);
  }
}
