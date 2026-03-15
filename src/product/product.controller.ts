import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { SessionAuthGuard } from 'src/auth/session-auth.guard';
import { UseGuards } from '@nestjs/common';
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(SessionAuthGuard)
  @Get('search') //query param
  search(@Req() req: any, @Query() query: any) {
    const userId = req.session?.userId;
    return this.productService.search(query, userId);
  }
  @UseGuards(SessionAuthGuard)
  @Get('search-review')
  findAll(@Query() query: any) {
    return this.productService.findReview(query);
  }
  @UseGuards(SessionAuthGuard)
  @Get('try-on')
  virtualTryOn(@Req() req: any, @Query('referenceImage') referenceImage: string) {
    const userId = req.session?.userId;
    return this.productService.virtualTryOn(referenceImage, userId);
  }
  @UseGuards(SessionAuthGuard)
  @Get('photo-recs')
  recommendFromPhotos(@Req() req: any) {
    console.log();
    const userId = req.session?.userId;
    return this.productService.recommendFromUserPhotos(userId);
  }
  @Post('pre-photo-recs')
  recommendFromProvidedPhotos(@Body('images') images: string[]) {
    console.log(
      'pre photo called🧑🏻‍💻 count:',
      Array.isArray(images) ? images.length : 'not array',
    );
    const limited = Array.isArray(images) ? images.slice(0, 10) : [];
    return this.productService.recommendFromProvidedPhotos(limited);
  }
  @UseGuards(SessionAuthGuard)
  @Get('text-recs')
  recommendFromText(@Req() req: any) {
    console.log('pre photoTEXT called🧑🏻‍💻 count:');
    const userId = req.session?.userId;
    return this.productService.recommendFromTextEmbeddings(userId);
  }

  @UseGuards(SessionAuthGuard)
  @Get('text-recs-single')
  recommendFromSingleText(
    @Req() req: any,
    @Query('url') url: string,
    @Query('page') page: string,
  ) {
    const userId = req.session?.userId;
    return this.productService.recommendFromSingleTextEmbedding(
      userId,
      url,
      Number(page) || 1,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('style-analysis')
  styleAnalysis(@Req() req: any, @Query('productId') productId: string) {
    const userId = req.session?.userId;
    return this.productService.styleAnalysis(productId, userId);
  }

  @Get(':id') //route param
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
