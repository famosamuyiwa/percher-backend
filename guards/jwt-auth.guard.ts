import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppwriteService } from 'src/appwrite/appwrite.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly appwriteService: AppwriteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Unauthorized');
    }

    const jwt = authHeader.replace('Bearer ', ''); // Extract JWT

    try {
      const user = await this.appwriteService.getUser(jwt);
      request.user = user; // Attach user to request
      request.jwt = jwt;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired JWT');
    }
  }
}
