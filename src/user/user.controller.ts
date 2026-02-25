import {
  Controller,
  Get,
  Put,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
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
  //   @Get('test-authProfile')
  //   async login(@Req() req:any, @Body() body: { email: string}) {
  //     return this.userService.login(body.email, body.password);
  //   }
}
