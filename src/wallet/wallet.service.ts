import { HttpStatus, Injectable } from '@nestjs/common';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { handleError } from 'utils/helper-methods';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from 'rdbms/entities/Wallet.entity';
import { ResponseStatus } from 'enums';
import { ApiResponse } from 'interfaces';
import { User } from 'rdbms/entities/User.entity';
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async findOne(userId: number) {
    try {
      //using user to make sure only loggedInUser can access their wallet
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['wallet', 'wallet.transactions'],
      });

      const wallet = user?.wallet;

      return {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Wallet fetch successful',
        data: wallet,
      };
    } catch (err) {
      handleError(err);
    }
  }

  async update(id: number, updateWalletDto: UpdateWalletDto) {
    try {
      await this.walletRepository.update(id, updateWalletDto);

      const payload: ApiResponse = {
        code: HttpStatus.OK,
        status: ResponseStatus.SUCCESS,
        message: 'Wallet updated successfully',
        data: null,
      };

      return payload;
    } catch (err) {
      handleError(err);
    }
  }
}
