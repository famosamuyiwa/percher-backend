import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiResponse, ResponseStatus } from 'interfaces';
import { User } from 'rdbms/entities/User.entity';
import { AppwriteService } from 'src/appwrite/appwrite.service';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly appwriteService: AppwriteService,
  ) {}

  async authenticateUser(jwt: string): Promise<ApiResponse<User>> {
    try {
      const appwriteUser = await this.appwriteService.getUser(jwt);

      let user = await this.userRepository.findOne({
        where: { email: appwriteUser.email },
      });

      if (!user) {
        user = this.userRepository.create({
          id: appwriteUser.$id,
          email: appwriteUser.email,
          name: appwriteUser.name,
          profilePicture: appwriteUser.prefs?.profilePicture,
        });

        this.userRepository.save(user);
      }
      const payload: ApiResponse<User> = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User fetched successful',
        data: user,
      };
      return payload;
    } catch (err) {
      this.log.error(`${err}`);

      // Check if the error is a ConflictException
      if (err instanceof HttpException) {
        throw err; // Re-throw the Conflict exception
      } else {
        throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async verifyEmailExists(email: string): Promise<boolean> {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: { email },
      });
    } catch (err) {
      console.log('Error: ', err.message);
    }

    return user ? true : false;
  }
}
