import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './users.service';
import { SessionAuthGuard } from 'src/auth/session-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('history')
  async history(@Query() req: any) {
    return this.userService.history();
  }

  @UseGuards(SessionAuthGuard)
  @Get('sync-ig')
  async getIG(@Query() query: any, @Req() request: any) {
    const userId = request.session.userId;
    return this.userService.syncIG(query, userId);
  }

  @UseGuards(SessionAuthGuard)
  @Get('user-ig-ims')
  async getUserIgImages(@Req() request: any) {
    const userId = request.session.userId;
    return this.userService.getUserProfileImages(userId);
  }
}
