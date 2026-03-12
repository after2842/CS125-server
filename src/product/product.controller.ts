import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { SessionAuthGuard } from 'src/auth/session-auth.guard';
import { UseGuards } from '@nestjs/common';
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(SessionAuthGuard)
  @Get('search') //query param
  search(@Query() query: any) {
    return this.productService.search(query);
  }
  @UseGuards(SessionAuthGuard)
  @Get('search-review')
  findAll(@Query() query: any) {
    return this.productService.findReview(query);
  }
  @UseGuards(SessionAuthGuard)
  @Get('try-on')
  virtualTryOn(@Query() query: any) {
    return this.productService.virtualTryOn(query);
  }
  @Get(':id') //route param
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
