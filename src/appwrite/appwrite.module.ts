import { Module } from '@nestjs/common';
import { AppwriteController } from './appwrite.controller';
import { AppwriteService } from './appwrite.service';

@Module({
  controllers: [AppwriteController],
  providers: [AppwriteService]
})
export class AppwriteModule {}
