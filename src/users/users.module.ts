import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users.entity';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Users])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
