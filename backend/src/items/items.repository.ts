import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseItem } from './entities/expense-item.entity';

@Injectable()
export class ItemsRepository {
  constructor(@InjectRepository(ExpenseItem) private repo: Repository<ExpenseItem>) {}

  async create(data: Partial<ExpenseItem>): Promise<ExpenseItem> {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async findOne(id: string, reportId: string): Promise<ExpenseItem> {
    const item = await this.repo.findOneBy({ id, reportId });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  save(item: ExpenseItem): Promise<ExpenseItem> {
    return this.repo.save(item);
  }

  async delete(id: string, reportId: string): Promise<void> {
    await this.repo.delete({ id, reportId });
  }
}
