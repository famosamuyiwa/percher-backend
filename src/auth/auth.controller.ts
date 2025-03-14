import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'rdbms/entities/User.entity';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user; // 🔹 User is automatically available in request
  }

  @Post('login')
  async login(@Body('jwt') jwt: string) {
    return await this.authService.authenticateUser(jwt);
  }

  @Post('verify-email')
  async verifyEmailExists(@Body('email') email: string) {
    return await this.authService.verifyEmailExists(email);
  }
}
