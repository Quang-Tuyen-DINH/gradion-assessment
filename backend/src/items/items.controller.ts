import { Controller, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports/:reportId/items')
export class ItemsController {
  constructor(private readonly service: ItemsService) {}

  @Post()
  @HttpCode(201)
  create(
    @Param('reportId') reportId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.service.create(reportId, userId, dto);
  }

  @Patch(':itemId')
  update(
    @Param('reportId') reportId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.service.update(reportId, itemId, userId, dto);
  }

  @Delete(':itemId')
  @HttpCode(204)
  remove(
    @Param('reportId') reportId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(reportId, itemId, userId);
  }
}
