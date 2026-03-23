import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateItemDto } from './create-item.dto';

async function validateDto(plain: object) {
  const dto = plainToInstance(CreateItemDto, plain);
  return validate(dto);
}

describe('CreateItemDto validation', () => {
  const valid = { amount: 50, currency: 'USD', merchantName: 'Uber', transactionDate: '2020-01-01' };

  it('accepts valid data', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejects amount > 1_000_000', async () => {
    const errors = await validateDto({ ...valid, amount: 2_000_000 });
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('rejects invalid currency format', async () => {
    const errors = await validateDto({ ...valid, currency: 'usd' });
    expect(errors.some(e => e.property === 'currency')).toBe(true);
  });

  it('rejects merchantName of length 1', async () => {
    const errors = await validateDto({ ...valid, merchantName: 'A' });
    expect(errors.some(e => e.property === 'merchantName')).toBe(true);
  });

  it('rejects empty string merchantName', async () => {
    const errors = await validateDto({ ...valid, merchantName: '' });
    expect(errors.some(e => e.property === 'merchantName')).toBe(true);
  });

  it('rejects a future transactionDate', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    const errors = await validateDto({ ...valid, transactionDate: future });
    expect(errors.some(e => e.property === 'transactionDate')).toBe(true);
  });
});
