import { ReportsService } from '../../src/reports/reports.service';
import { ReportStatus } from '../../src/common/enums/report-status.enum';
import {
  UnprocessableEntityException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const mockRepo = {
  findOneWithItems: jest.fn(),
  findAllByUser: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('ReportsService — state machine', () => {
  let service: ReportsService;
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService(mockRepo as any);
  });

  // --- Valid transitions ---
  it('DRAFT → SUBMITTED on submit()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.DRAFT,
      items: [],
    });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.submit('1', userId);
    expect(result.status).toBe(ReportStatus.SUBMITTED);
  });

  it('SUBMITTED → APPROVED on approve()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.SUBMITTED,
      items: [],
    });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.approve('1');
    expect(result.status).toBe(ReportStatus.APPROVED);
  });

  it('SUBMITTED → REJECTED on reject()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.SUBMITTED,
      items: [],
    });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.reject('1');
    expect(result.status).toBe(ReportStatus.REJECTED);
  });

  it('REJECTED → DRAFT on returnToDraft()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.REJECTED,
      items: [],
    });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.returnToDraft('1', userId);
    expect(result.status).toBe(ReportStatus.DRAFT);
  });

  // --- Invalid transitions ---
  it('throws 422 when submitting non-DRAFT report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.APPROVED,
      items: [],
    });
    await expect(service.submit('1', userId)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('throws 422 when approving non-SUBMITTED report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.DRAFT,
      items: [],
    });
    await expect(service.approve('1')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('throws 422 when rejecting non-SUBMITTED report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.APPROVED,
      items: [],
    });
    await expect(service.reject('1')).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('throws 422 when returnToDraft on non-REJECTED report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.SUBMITTED,
      items: [],
    });
    await expect(service.returnToDraft('1', userId)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  // --- Edit/delete guards ---
  it('throws 422 when editing report not in DRAFT', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.SUBMITTED,
      items: [],
    });
    await expect(service.update('1', userId, { title: 'new' })).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('throws 422 when deleting report not in DRAFT', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId,
      status: ReportStatus.APPROVED,
      items: [],
    });
    await expect(service.remove('1', userId)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  // --- Ownership ---
  it('throws 403 when user accesses another user report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({
      id: '1',
      userId: 'other-user',
      status: ReportStatus.DRAFT,
      items: [],
    });
    await expect(service.submit('1', userId)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
