import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  //paystack IPs
  private readonly allowedIps = [
    '52.31.139.75',
    '52.49.173.169',
    '52.214.14.220',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp: string =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '';

    console.log('webhook client IP:', clientIp);

    if (!this.allowedIps.includes(clientIp)) {
      throw new ForbiddenException('Access denied');
    }

    next();
  }
}
