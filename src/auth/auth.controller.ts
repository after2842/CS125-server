import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { LoginDto, SignupDto } from './auth.dto';

type AuthedRequest = Request & {
  session: any; // express-session adds this
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Req() req: AuthedRequest, @Body() dto: SignupDto) {
    const user = await this.authService.signup(dto);

    // auto login => write the session JS object and write Redis right after creating a new User row.
    // so the client will receive the session id as it finished signup proccess
    await this.authService.establishSession(req, user.id);

    return { message: 'Signup successful', user };
  }

  @Post('login')
  async login(@Req() req: AuthedRequest, @Body() dto: LoginDto) {
    const user = await this.authService.validateCredentials(
      dto.email,
      dto.password,
    );

    await this.authService.establishSession(req, user.id);

    return { message: 'Login successful', user };
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  async me(@Req() req: AuthedRequest) {
    const userId = req.session.userId as number | undefined;
    if (!userId) throw new UnauthorizedException();

    const user = await this.authService.getSafeUserById(userId);
    return { user };
  }

  @Post('logout')
  async logout(@Req() req: AuthedRequest, @Res() res: Response) {
    // destroy server-side session
    req.session.destroy((err: any) => {
      // even if err, clear cookie to remove browser-side reference
      res.clearCookie('sid');
      if (err) return res.status(500).json({ message: 'Logout failed' });
      return res.json({ message: 'Logged out' });
    });
  }
}
