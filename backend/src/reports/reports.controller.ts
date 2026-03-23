import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { FilterReportsDto } from './dto/filter-reports.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() q: FilterReportsDto) {
    return this.service.findAll(userId, q.status);
  }

  @Post()
  @HttpCode(201)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.service.create(userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.submit(id, userId);
  }

  @Post(':id/return-to-draft')
  returnToDraft(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.returnToDraft(id, userId);
  }
}
