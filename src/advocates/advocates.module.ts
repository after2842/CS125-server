import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvocatesController } from './advocates.controller';
import { AdvocatesService } from './advocates.service';
import { Advocate } from './advocate.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Advocate])],
  controllers: [AdvocatesController],
  providers: [AdvocatesService],
})
export class AdvocatesModule {}
