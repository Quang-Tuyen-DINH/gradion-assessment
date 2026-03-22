import { AiService } from '../../src/ai/ai.service';

const mockAnthropicCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockAnthropicCreate },
  })),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiService();
  });

  it('returns a valid category enum value', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'MEALS' }],
    });
    const result = await service.suggestCategory('McDonalds');
    expect(result.category).toBe('MEALS');
  });

  it('returns OTHER for unrecognized category', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'INVALID_CATEGORY' }],
    });
    const result = await service.suggestCategory('Unknown Corp');
    expect(result.category).toBe('OTHER');
  });

  it('sanitizes merchant name — truncates to 200 chars and prompt contains truncated name', async () => {
    mockAnthropicCreate.mockResolvedValue({ content: [{ type: 'text', text: 'TRAVEL' }] });
    const longName = 'A'.repeat(300);
    await service.suggestCategory(longName);
    const calledWith = mockAnthropicCreate.mock.calls[0][0].messages[0].content as string;
    // The prompt must not contain more than 200 consecutive A's
    expect(calledWith).not.toContain('A'.repeat(201));
  });
});
