import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppwriteService } from './appwrite.service';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';

@Controller('appwrite')
export class AppwriteController {
  constructor(private appwriteService: AppwriteService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user; // 🔹 User is automatically available in request
  }
}
