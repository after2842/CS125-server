import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FurnitureService } from './furniture.service';
import { SessionAuthGuard } from 'src/auth/session-auth.guard';
import { UseGuards } from '@nestjs/common';
@Controller('furniture')
export class FurnitureController {
  constructor(private readonly furnitureService: FurnitureService) {}

  // @UseGuards(SessionAuthGuard)
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

