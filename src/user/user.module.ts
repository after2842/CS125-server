import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { Furniture } from '../furniture/furniture.entity';
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Furniture])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
