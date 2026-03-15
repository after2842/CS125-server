import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';
import { Auth } from './auth.entity';
import { LoginDto, SignupDto } from './auth.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Users } from 'src/users/users.entity';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { no } from 'zod/v4/locales';
type AuthedRequest = Request & { session: any };

@Injectable()
export class AuthService {
  constructor(private readonly SupabaseService: SupabaseService) {}
  // --- Signup (writes to DB) ---
  async signupStart(dto: SignupDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    try {
      const data = await this.SupabaseService.signUp(
        normalizedEmail,
        dto.password,
      );

      if (data.user) {
        return { message: 'Verification email sent. Please check your inbox.' };
      } else {
        throw new InternalServerErrorException('Interneral error');
      }
    } catch {
      throw new ConflictException(
        'This email may already be in use, or an internal error occurred.',
      );
    }

    // pre-check before the db schema level check
    // faster err response to the user | looks more normal? err
  }

  // --- Signup (writes to DB) ---
  async signupVerify(dto: SignupDto) {
    console.log('singup verify /');
    const normalizedEmail = dto.email.trim().toLowerCase();
    try {
      // pre-check before the db schema level check
      // faster err response to the user | looks more normal? err
      const data = await this.SupabaseService.verifyOtp(
        normalizedEmail,
        dto.code,
        'email',
      );
      if (data.user) {
        console.log('datauser');
        // otp is correct
        const { data, error } = await this.SupabaseService.getClient() // we retrieve that specific row, because now the row for this user is a complete row of Users(and also verified )
          .from('users')
          .insert({ email: normalizedEmail, name: dto.name })
          .select()
          .single();
        if (error) {
          throw new InternalServerErrorException(error);
        }
        return data;
      } else {
        throw new UnauthorizedException('Wrong OTP');
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // --- Login credential check ---
  async validateCredentials(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    // passwordHash is select:false, so we must explicitly select it here
    try {
      const res = await this.SupabaseService.signIn(
        normalizedEmail,
        dto.password,
      );
      if (res.user) {
        console.log(res.user.email);
        const user = await this.SupabaseService.getClient()
          .from('users')
          .select('*')
          .eq('email', res.user.email)
          .single();
        if (!user) throw new InternalServerErrorException();
        return user.data.id;
      }
    } catch (error) {
      console.log('supabase failed auth', error);
      throw new UnauthorizedException(error);
    }
    return;
  }

  // --- Session establishment (security: regenerate) ---
  async establishSession(req: AuthedRequest, userId: string) {
    // Regenerate to prevent session fixation attacks
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err: any) => (err ? reject(err) : resolve()));
    });
    console.log('establishsession: ', userId);
    req.session.userId = userId;
    req.session.authAt = Date.now();

    // Ensure it’s saved before responding
    await new Promise<void>((resolve, reject) => {
      req.session.save((err: any) => (err ? reject(err) : resolve())); //.save => write this session to Redis => Express middleware write this session to REdis
    });
  }

  async getSafeUserById(userId: string) {
    const user = await this.SupabaseService.getUserById(userId);
    if (!user) throw new UnauthorizedException();
    return this.toSafeUser(user);
  }

  private toSafeUser(user: any) {
    // passwordHash is usually not present due to select:false, but never return it anyway
    console.log('tosafeuser called');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      is_connected: user.is_connected,
      // createdAt: user.createdAt,
      // updatedAt: user.updatedAt,
    };
  }
}
