import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseStatus } from 'enums';
import { ApiResponse } from 'interfaces';
import { Waitlist } from 'rdbms/entities/Waitlist';
import { Repository } from 'typeorm';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(Waitlist)
    private readonly waitlistRepository: Repository<Waitlist>,
  ) {}

  async create(body: { email: string }) {
    const existingWaitlist = await this.waitlistRepository.findOne({
      where: { email: body.email },
    });
    if (existingWaitlist) {
      throw new HttpException(
        'Email already exists in waitlist',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.waitlistRepository.save({
      email: body.email,
    });

    const payload: ApiResponse = {
      code: HttpStatus.OK,
      status: ResponseStatus.SUCCESS,
      message: 'Waitlist entry created successfully',
      data: null,
    };

    return payload;
  }
}
