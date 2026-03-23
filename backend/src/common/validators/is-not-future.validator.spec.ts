import { validate } from 'class-validator';
import { IsNotFuture } from './is-not-future.validator';
import { IsOptional, IsDateString } from 'class-validator';

class TestDto {
  @IsOptional()
  @IsDateString()
  @IsNotFuture()
  transactionDate?: string;
}

describe('@IsNotFuture()', () => {
  it('accepts a past date', async () => {
    const dto = Object.assign(new TestDto(), { transactionDate: '2020-01-01' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const dto = Object.assign(new TestDto(), { transactionDate: today });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a future date', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    const dto = Object.assign(new TestDto(), { transactionDate: future });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      IsNotFuture: 'transactionDate must not be a future date',
    });
  });

  it('passes when field is absent (optional)', async () => {
    const dto = new TestDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
