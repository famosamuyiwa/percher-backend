import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Invalid header credentials');
    }

    const jwt = authHeader.replace('Bearer ', ''); // Extract JWT
    try {
      const payload = this.jwtService.verify(jwt);
      request.userId = payload.userId; // Attach user to request
      request.jwt = jwt;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid JWT');
    }
  }
}
