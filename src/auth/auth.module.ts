import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { Auth } from './auth.entity';
import { Users } from '../users/users.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth]),
    TypeOrmModule.forFeature([Users]),
    SupabaseModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard],
  exports: [AuthService, SessionAuthGuard],
})
export class AuthModule {}
