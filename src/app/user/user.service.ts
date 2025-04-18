import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiResponse } from 'interfaces';
import { User } from 'rdbms/entities/User.entity';
import { Repository } from 'typeorm';
import { handleError } from 'utils/helper-methods';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseStatus } from 'enums';
import { UpdateUserPushTokenDto } from './dto/update-user-push-token.dto';
import { Not } from 'typeorm';

@Injectable()
export class UserService {
  private readonly log = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserByUserId(id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user)
        throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);

      const payload: ApiResponse<User> = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User fetched successfully',
        data: user,
      };
      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      let user = await this.userRepository.preload({
        id,
        ...updateUserDto,
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      user = await this.userRepository.save(user);

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User updated successfully',
        data: user,
      };

      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async updateUserPushToken(
    id: number,
    updateUserPushTokenDto: UpdateUserPushTokenDto,
  ) {
    try {
      // First, find and nullify any other users with the same token
      await this.userRepository.update(
        { expoPushToken: updateUserPushTokenDto.expoPushToken, id: Not(id) },
        { expoPushToken: undefined },
      );

      // Then update the current user's token
      await this.userRepository.update(id, {
        expoPushToken: updateUserPushTokenDto.expoPushToken,
      });

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Push token updated successfully',
        data: null,
      };

      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async remove(id: number) {
    try {
      await this.userRepository.delete({ id });

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User deleted successfully',
        data: null,
      };
      return payload;
    } catch (err) {
      handleError(err);
    }
  }
}
