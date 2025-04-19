import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'guards/jwt-auth.guard';
import { UpdateUserPushTokenDto } from './dto/update-user-push-token.dto';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  getUserByUserId(@Param('id') id: number) {
    return this.userService.getUserByUserId(id);
  }

  @Put('')
  updateCurrentUser(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    const loggedInUserId = req.userId;
    return this.userService.update(loggedInUserId, updateUserDto);
  }

  @Put('/push-token')
  updateUserPushToken(
    @Body() updateUserPushTokenDto: UpdateUserPushTokenDto,
    @Request() req,
  ) {
    const loggedInUserId = req.userId;
    return this.userService.updateUserPushToken(
      loggedInUserId,
      updateUserPushTokenDto,
    );
  }

  @Delete('')
  remove(@Request() req) {
    const loggedInUserId = req.userId;
    return this.userService.remove(loggedInUserId);
  }
}
