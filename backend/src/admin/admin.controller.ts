import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from '../reports/reports.service';
import { FilterReportsDto } from '../reports/dto/filter-reports.dto';
import { UserRole } from '../common/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/reports')
export class AdminController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  findAll(@Query() q: FilterReportsDto) {
    return this.reports.findAllAdmin(q.status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reports.findOneAdmin(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.reports.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    // reason is accepted per spec but not persisted (no DB column) — documented in DECISIONS.md
    return this.reports.reject(id);
  }
}
