import { Controller, Get, Param, Query } from '@nestjs/common';
import { FurnitureService } from './furniture.service';
import { SessionAuthGuard } from 'src/auth/session-auth.guard';
import { UseGuards } from '@nestjs/common';
@Controller('furniture')
export class FurnitureController {
  constructor(private readonly furnitureService: FurnitureService) {}

  @UseGuards(SessionAuthGuard)
  @Get('search') //query param
  search(@Query() query: any) {
    return this.furnitureService.search(query);
  }
  @UseGuards(SessionAuthGuard)
  @Get('search-review')
  findAll(@Query() query: any) {
    return this.furnitureService.findReview(query);
  }

  @Get(':id') //route param
  findOne(@Param('id') id: string) {
    return this.furnitureService.findOne(id);
  }
}
