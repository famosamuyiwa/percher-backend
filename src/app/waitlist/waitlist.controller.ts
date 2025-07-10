import { Controller, Post, Body } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('')
  createWaitlist(@Body() body: { email: string }) {
    return this.waitlistService.create(body);
  }
}
