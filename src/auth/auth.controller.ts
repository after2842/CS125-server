import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
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

  // call supabase.auth.signUp({ email, password }) => supabase maek a session/temp record
  // send ok, redner the 6 digit prompt to frontend
  @Post('signup/start')
  async signupStart(@Body() dto: SignupDto) {
    return await this.authService.signupStart(dto);
  }

  // when six digit prompt is sent + email
  // supabase otp will verify the hash.
  @Post('signup/verify')
  async signupVerify(@Req() req: AuthedRequest, @Body() dto: SignupDto) {
    const user = await this.authService.signupVerify(dto);
    if (user.id) {
      // auto login => write the session JS object and write Redis right after creating a new User row.
      // so the client will receive the session id as it finished signup proccess
      await this.authService.establishSession(req, user.id);
      console.log(user.id);

      return { message: 'OTP successful' };
    } else {
      throw new InternalServerErrorException('user.id not retrieved?');
    }
  }

  // @Post('signup/resend')
  // async signupResend(@Req() req: AuthedRequest, @Body() dto: SignupDto) {
  //   const user = await this.authService.signup(dto);

  //   // auto login => write the session JS object and write Redis right after creating a new User row.
  //   // so the client will receive the session id as it finished signup proccess
  //   await this.authService.establishSession(req, user.id);

  //   return { message: 'Signup successful', user };
  // }

  @Post('login')
  async login(@Req() req: AuthedRequest, @Body() dto: LoginDto) {
    const userId = await this.authService.validateCredentials(dto);
    console.log('passing', userId);
    if (!userId) throw new InternalServerErrorException();
    await this.authService.establishSession(req, userId);

    return { message: 'OTP successful' };
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  async me(@Req() req: AuthedRequest) {
    const userId = req.session.userId as string | undefined;
    if (!userId) throw new UnauthorizedException();
    console.log('userid in me controller', userId);
    const user = await this.authService.getSafeUserById(userId); // user object may contain confidential info
    console.log('user object retreived🧑🏻‍💻', user);
    return { user: user };
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
