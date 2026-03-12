import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { SearchModule } from '../search/search.module';
import { VirtualTryOnService } from './virtual-try-on.service';
@Module({
  imports: [TypeOrmModule.forFeature([Product]), SearchModule],
  controllers: [ProductController],
  providers: [ProductService, VirtualTryOnService],
})
export class ProductModule {}
