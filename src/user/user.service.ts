import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiResponse, ResponseStatus } from 'interfaces';
import { User } from 'rdbms/entities/User.entity';
import { Repository } from 'typeorm';
import { handleError } from 'utils/helper-methods';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserByUserId(id: string) {
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userRepository.preload({
        id,
        ...updateUserDto,
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      await this.userRepository.save(user);

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User updated successfully',
        data: { user },
      };

      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async remove(id: string) {
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
