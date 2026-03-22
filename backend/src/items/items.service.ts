import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ItemsRepository } from './items.repository';
import { ReportsService } from '../reports/reports.service';
import { ReportStatus } from '../common/enums/report-status.enum';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private repo: ItemsRepository, private reports: ReportsService) {}

  private async guardDraft(reportId: string, userId: string) {
    const report = await this.reports.findAndCheckOwnerRaw(reportId, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot modify items on a report with status ${report.status}`);
    }
    return report;
  }

  async create(reportId: string, userId: string, dto: CreateItemDto) {
    await this.guardDraft(reportId, userId);
    return this.repo.create({ reportId, ...dto });
  }

  async update(reportId: string, itemId: string, userId: string, dto: UpdateItemDto) {
    await this.guardDraft(reportId, userId);
    const item = await this.repo.findOne(itemId, reportId);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(reportId: string, itemId: string, userId: string): Promise<void> {
    await this.guardDraft(reportId, userId);
    await this.repo.delete(itemId, reportId);
  }
}
