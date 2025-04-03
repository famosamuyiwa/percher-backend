import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { OAuthRequest } from 'interfaces';
import { SignInDto } from './dto/signin-auth.dto';
import { ResetPasswordDto } from './dto/resetpassword-auth.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return this.authService.findUserByUserId(req.userId);
  }

  @Post('register')
  async register(@Body() user: CreateAuthDto) {
    return this.authService.register(user);
  }

  @Post('login')
  async login(@Body() user: SignInDto) {
    return this.authService.login(user);
  }

  @Get('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.userId);
  }

  @Post('/oauth')
  async loginWithOAuth(@Body() details: OAuthRequest) {
    return this.authService.loginWithOAuth(details);
  }

  @Post('reset-password')
  async resetPassword(@Body() details: ResetPasswordDto) {
    return this.authService.resetPassword(details);
  }

  @Get('check/:email')
  findUserByEmail(@Param('email') email: string) {
    return this.authService.verifyUserByEmail(email);
  }

  @Get('verify/:token')
  verifyOTP(@Param('token') token: string, @Query('email') email: string) {
    return this.authService.verifyOTP(token, email);
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }
}
