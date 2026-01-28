import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FurnitureController } from './furniture.controller';
import { FurnitureService } from './furniture.service';
import { Furniture } from './furniture.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Furniture])],
  controllers: [FurnitureController],
  providers: [FurnitureService],
})
export class FurnitureModule {}
