import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import 'dotenv';
import { SignInDto } from './dto/signin-auth.dto';
import { ResetPasswordDto } from './dto/resetpassword-auth.dto';
import {
  generateOTP,
  generateReferralCode,
  handleError,
} from 'utils/helper-methods';
import { ApiResponse, OAuthRequest } from 'interfaces';
import { User } from 'rdbms/entities/User.entity';
import { OtpLog } from 'rdbms/entities/OtpLog.entity';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from 'rdbms/entities/RefreshToken.entity';
import { v4 as uuidv4 } from 'uuid';
import { ResponseStatus } from 'enums';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OtpLog)
    private readonly otpLogRepository: Repository<OtpLog>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(userDetails: CreateAuthDto) {
    try {
      const { email, password, name, referralCode } = userDetails;
      if (!email || !password || !name)
        throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);

      let referrer: User | undefined | null = undefined;

      const userExist = await this.userRepository.findOne({
        where: { email },
      });

      if (userExist) {
        throw new HttpException(
          `Username or email already exists`,
          HttpStatus.CONFLICT,
        );
      }

      if (referralCode) {
        referrer = await this.userRepository.findOne({
          where: { referralCode },
        });
        if (referrer) {
          referrer.referralPoints += 100;
          referrer.referralCount += 1;
          await this.userRepository.save(referrer);
        } else {
          throw new HttpException(
            `Referral code is invalid`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const myReferralCode = generateReferralCode(name);
      const newUser = this.userRepository.create({
        name,
        password: hashedPassword,
        email,
        referralCode: myReferralCode,
      });

      if (referrer) {
        newUser['referredBy'] = referrer;
      }

      const user = await this.userRepository.save(newUser);

      return {
        code: HttpStatus.CREATED,
        status: ResponseStatus.SUCCESS,
        message: 'User created successfully',
        data: await this.generateUserTokens(user.id),
      };
    } catch (err) {
      handleError(err);
    }
  }

  async login(userDetails: SignInDto) {
    try {
      const { email, password } = userDetails;
      if (!email || !password)
        throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);

      const user = await this.userRepository.findOne({
        where: [{ email: email }],
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new HttpException(
          `Invalid username or password!`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User logged in successfully',
        data: await this.generateUserTokens(user.id),
      };
    } catch (err) {
      handleError(err);
    }
  }

  async loginWithOAuth(credentials: OAuthRequest) {
    try {
      const { provider, name, email } = credentials;
      if (!provider || !name || !email)
        throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);

      let user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        const myReferralCode = generateReferralCode(name);
        user = this.userRepository.create({
          name,
          email,
          referralCode: myReferralCode,
        });
        await this.userRepository.save(user);
      }

      if (user.password) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User logged in successfully',
        data: await this.generateUserTokens(user.id),
      };
    } catch (err) {
      handleError(err);
    }
  }

  async logout(userId: string) {
    try {
      await this.dropRefreshToken(userId);
      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User logged out successfully',
        data: null,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async resetPassword(details: ResetPasswordDto) {
    try {
      const { email, password } = details;
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new HttpException(
          `User: ${email} not found!`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await this.userRepository.save(user);

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Password successfully updated',
        data: null,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async createOTPLog(email: string, length?: number) {
    const configLength = length ?? 4;
    const token = generateOTP(configLength);

    try {
      const otpLog = this.otpLogRepository.create({
        configLength: '' + configLength,
        email,
        lifetime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes in milliseconds
        token,
        isDeactivated: false,
      });
      this.otpLogRepository.save(otpLog);
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

  async verifyOTP(token: string, email: string): Promise<ApiResponse> {
    if (!token || !email) {
      throw new HttpException(
        'Token param and email query are required.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const otpLog = await this.otpLogRepository.findOne({
        where: { email },
        order: { createdAt: 'DESC' }, // Sort by timestamp in descending order
      });

      if (!otpLog) {
        throw new HttpException(
          `OTP Log for ${email} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      if (otpLog.token !== token) {
        throw new HttpException(
          `OTP Log for ${email} does not match`,
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (otpLog.isDeactivated) {
        throw new HttpException(
          `OTP Log for ${email} has either been used or expired`,
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (new Date() > otpLog.lifetime) {
        await this.otpLogRepository.update(otpLog.id, {
          isDeactivated: true,
          modifiedAt: new Date(),
        });

        throw new HttpException(
          `OTP Log for ${email} is expired`,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Mark OTP as used
      await this.otpLogRepository.update(otpLog.id, {
        isDeactivated: true,
        modifiedAt: new Date(),
      });

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'OTP verification successful',
        data: null,
      };

      return payload;
    } catch (err) {
      this.log.error(`${err}`);

      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async verifyUserByEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'User with email already exists',
        data: null,
      };

      await this.createOTPLog(email);

      return payload;
    } catch (err) {
      handleError(err);
    }
  }

  async findUserByUserId(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user)
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

      const payload: ApiResponse = {
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

  async generateUserTokens(userId) {
    const accessToken = this.jwtService.sign({ userId });
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, userId);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    //delete previous token
    await this.refreshTokenRepository.delete({ userId });

    const tokenData = this.refreshTokenRepository.create({
      token,
      userId,
      expiryDate,
    });

    await this.refreshTokenRepository.save(tokenData);
  }

  async dropRefreshToken(userId) {
    //delete previous token
    await this.refreshTokenRepository.delete({ userId });
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: {
        token: refreshToken,
      },
    });

    if ((token && token.expiryDate <= new Date()) || !token) {
      throw new HttpException('refresh token invalid', HttpStatus.UNAUTHORIZED);
    }

    return this.generateUserTokens(token.userId);
  }
}
