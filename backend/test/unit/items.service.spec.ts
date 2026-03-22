import { ItemsService } from '../../src/items/items.service';
import { ReportsService } from '../../src/reports/reports.service';
import { ReportStatus } from '../../src/common/enums/report-status.enum';
import { UnprocessableEntityException } from '@nestjs/common';

describe('ItemsService', () => {
  let service: ItemsService;
  let reportsService: jest.Mocked<ReportsService>;
  let itemsRepo: any;

  beforeEach(() => {
    reportsService = { findAndCheckOwnerRaw: jest.fn() } as any;
    itemsRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), delete: jest.fn() };
    service = new ItemsService(itemsRepo, reportsService);
  });

  it('throws 422 when adding item to non-DRAFT report', async () => {
    reportsService.findAndCheckOwnerRaw.mockResolvedValue({ status: ReportStatus.SUBMITTED } as any);
    await expect(service.create('r1', 'u1', { amount: 10 } as any)).rejects.toThrow(UnprocessableEntityException);
  });

  it('allows adding item to DRAFT report', async () => {
    reportsService.findAndCheckOwnerRaw.mockResolvedValue({ id: 'r1', status: ReportStatus.DRAFT } as any);
    itemsRepo.create.mockResolvedValue({ id: 'i1', reportId: 'r1', amount: 10 });
    const result = await service.create('r1', 'u1', { amount: 10 } as any);
    expect(result.id).toBe('i1');
  });
});
