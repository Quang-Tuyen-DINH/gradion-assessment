import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportStatus } from '../common/enums/report-status.enum';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(private repo: ReportsRepository) {}

  private async findAndCheckOwner(id: string, userId: string): Promise<Report> {
    const report = await this.repo.findOneWithItems(id);
    if (!report) throw new NotFoundException(`Report ${id} not found`);
    if (report.userId !== userId) throw new ForbiddenException('Access denied');
    return report;
  }

  private async findOrFail(id: string): Promise<Report> {
    const report = await this.repo.findOneWithItems(id);
    if (!report) throw new NotFoundException(`Report ${id} not found`);
    return report;
  }

  private computeTotalAmount(report: Report): number {
    return (report.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
  }

  private toResponse(report: Report) {
    return { ...report, totalAmount: this.computeTotalAmount(report) };
  }

  async findAll(userId: string, status?: ReportStatus) {
    const data = await this.repo.findAllByUser(userId, status);
    return { data: data.map((r) => this.toResponse(r)), total: data.length };
  }

  async findAllAdmin(status?: ReportStatus) {
    const data = await this.repo.findAll(status);
    return { data: data.map((r) => this.toResponse(r)), total: data.length };
  }

  async findOne(id: string, userId: string) {
    const report = await this.findAndCheckOwner(id, userId);
    return this.toResponse(report);
  }

  async findOneAdmin(id: string) {
    const report = await this.findOrFail(id);
    return this.toResponse(report);
  }

  async create(userId: string, dto: CreateReportDto) {
    const report = await this.repo.create({ userId, ...dto, status: ReportStatus.DRAFT });
    return this.toResponse(report);
  }

  async update(id: string, userId: string, dto: UpdateReportDto) {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot edit a report with status ${report.status}`);
    }
    Object.assign(report, dto);
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async remove(id: string, userId: string): Promise<void> {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot delete a report with status ${report.status}`);
    }
    await this.repo.delete(id);
  }

  async submit(id: string, userId: string) {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot submit a report with status ${report.status}`);
    }
    report.status = ReportStatus.SUBMITTED;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async returnToDraft(id: string, userId: string) {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.REJECTED) {
      throw new UnprocessableEntityException(`Cannot return to draft a report with status ${report.status}`);
    }
    report.status = ReportStatus.DRAFT;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async approve(id: string) {
    const report = await this.findOrFail(id);
    if (report.status !== ReportStatus.SUBMITTED) {
      throw new UnprocessableEntityException(`Cannot approve a report with status ${report.status}`);
    }
    report.status = ReportStatus.APPROVED;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async reject(id: string) {
    const report = await this.findOrFail(id);
    if (report.status !== ReportStatus.SUBMITTED) {
      throw new UnprocessableEntityException(`Cannot reject a report with status ${report.status}`);
    }
    report.status = ReportStatus.REJECTED;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }
}
