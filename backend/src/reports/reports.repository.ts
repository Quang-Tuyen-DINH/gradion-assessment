import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportStatus } from '../common/enums/report-status.enum';

@Injectable()
export class ReportsRepository {
  constructor(@InjectRepository(Report) private repo: Repository<Report>) {}

  async findOneWithItems(id: string): Promise<Report | null> {
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.items', 'items')
      .where('r.id = :id', { id })
      .getOne();
  }

  findAllByUser(userId: string, status?: ReportStatus): Promise<Report[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.items', 'items')
      .where('r.user_id = :userId', { userId });
    if (status) qb.andWhere('r.status = :status', { status });
    return qb.getMany();
  }

  findAll(status?: ReportStatus): Promise<Report[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.items', 'items');
    if (status) qb.where('r.status = :status', { status });
    return qb.getMany();
  }

  create(data: Partial<Report>): Promise<Report> {
    const report = this.repo.create(data);
    return this.repo.save(report);
  }

  save(report: Report): Promise<Report> {
    return this.repo.save(report);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
