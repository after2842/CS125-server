import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';

import { User } from '../user/user.entity';
import { SignupDto } from './auth.dto';

type AuthedRequest = Request & { session: any };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // --- Signup (writes to DB) ---
  async signup(dto: SignupDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // pre-check before the db schema level check
    // faster err response to the user | looks more normal? err
    const exists = await this.users.exists({
      where: { email: normalizedEmail },
    });
    if (exists) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        field: 'email',
        message: 'Email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const newUser = this.users.create({
        email: normalizedEmail,
        passwordHash,
        name: dto.name.trim(),
      });

      const saved = await this.users.save(newUser); //DB write
      return this.toSafeUser(saved);
    } catch (err: any) {
      // DB-level check fails
      const code = err?.code ?? err?.driverError?.code;
      if (
        code === '23505' || //postgresql err code
        code === 'SQLITE_CONSTRAINT'
      ) {
        throw new ConflictException({
          code: 'EMAIL_TAKEN',
          field: 'email',
          message: 'Email already exists',
        });
      }
      throw err;
    }
  }

  // --- Login credential check ---
  async validateCredentials(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(normalizedEmail);
    // passwordHash is select:false, so we must explicitly select it here
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: normalizedEmail })
      .getOne();
    if (!user) {
      console.log('not found user');
    } else console.log(user?.name, 'is logged in');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('password mismatch');
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toSafeUser(user); //toSafeUser will block fetching passwordHash.
    // Even though passwordHash is not fetchable by default ({select: false})
    // this specific function, for example, allowed selecting to check password equal
    // it will expose passwordHash if I just return user
  }

  // --- Session establishment (security: regenerate) ---
  async establishSession(req: AuthedRequest, userId: number) {
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

  async getSafeUserById(userId: number) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toSafeUser(user);
  }

  private toSafeUser(user: User) {
    // passwordHash is usually not present due to select:false, but never return it anyway
    console.log('tosafeuser called');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      // createdAt: user.createdAt,
      // updatedAt: user.updatedAt,
    };
  }
}
