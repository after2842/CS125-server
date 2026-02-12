import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FurnitureService } from './furniture.service';

@Controller('furniture')
export class FurnitureController {
  constructor(private readonly furnitureService: FurnitureService) {}

  @Get('search')
  search(@Query() query: any) {
    return this.furnitureService.search(query);
  }

  @Get('search-all')
  findAll() {
    return this.furnitureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.furnitureService.findOne(+id);
  }
  
  @Post('recommend')
  recommend(@Body() body: any) {
    return this.furnitureService.recommend(body);
  }
}

