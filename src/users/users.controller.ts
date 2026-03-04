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
  @Get('get-ig')
  async getIG(@Query() req: string) {
    return this.userService.retrieveIG(req);
  }
}
