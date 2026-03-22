import { ItemsService } from '../../src/items/items.service';
import { ItemsRepository } from '../../src/items/items.repository';
import { ReportsService } from '../../src/reports/reports.service';
import { ReportStatus } from '../../src/common/enums/report-status.enum';
import { UnprocessableEntityException, BadRequestException } from '@nestjs/common';

describe('ItemsService', () => {
  let service: ItemsService;
  let reportsService: jest.Mocked<ReportsService>;
  let itemsRepo: jest.Mocked<ItemsRepository>;

  beforeEach(() => {
    reportsService = { findAndCheckOwnerRaw: jest.fn() } as any;
    itemsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new ItemsService(itemsRepo, reportsService);
  });

  describe('create', () => {
    it('throws 422 when adding item to non-DRAFT report', async () => {
      reportsService.findAndCheckOwnerRaw.mockResolvedValue({ status: ReportStatus.SUBMITTED } as any);
      await expect(service.create('r1', 'u1', { amount: 10 } as any)).rejects.toThrow(UnprocessableEntityException);
    });

    it('allows adding item to DRAFT report', async () => {
      reportsService.findAndCheckOwnerRaw.mockResolvedValue({ id: 'r1', status: ReportStatus.DRAFT } as any);
      itemsRepo.create.mockResolvedValue({ id: 'i1', reportId: 'r1', amount: 10 } as any);
      const result = await service.create('r1', 'u1', { amount: 10 } as any);
      expect(result.id).toBe('i1');
    });
  });

  describe('update', () => {
    it('throws 422 when updating item on non-DRAFT report', async () => {
      reportsService.findAndCheckOwnerRaw.mockResolvedValue({ status: ReportStatus.SUBMITTED } as any);
      await expect(service.update('r1', 'i1', 'u1', { amount: 20 })).rejects.toThrow(UnprocessableEntityException);
    });

    it('throws 400 when update body is empty', async () => {
      reportsService.findAndCheckOwnerRaw.mockResolvedValue({ status: ReportStatus.DRAFT } as any);
      await expect(service.update('r1', 'i1', 'u1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('throws 422 when deleting item on non-DRAFT report', async () => {
      reportsService.findAndCheckOwnerRaw.mockResolvedValue({ status: ReportStatus.APPROVED } as any);
      await expect(service.remove('r1', 'i1', 'u1')).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
