import { Controller, Get, Put, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { UserService } from './user.service';




@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('test')
  async test(@Req() req: any) {
    return this.userService.test(req.session.sessionId);
  }
  @Post(':userId/click/:furnitureId')
    async recordFurnitureClick(
      @Param('userId') userId: string,
      @Param('furnitureId') furnitureId: string,
    ) {
      return this.userService.recordFurnitureClick(
        Number(userId),
        Number(furnitureId),
      );
  }
  //   @Get('test-authProfile')
  //   async login(@Req() req:any, @Body() body: { email: string}) {
  //     return this.userService.login(body.email, body.password);
  //   }
}
