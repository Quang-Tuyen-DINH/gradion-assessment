import {
  IsNumber, Min, Max, IsOptional, IsString, MinLength, MaxLength,
  IsEnum, IsDateString, IsNotEmpty, Matches,
} from 'class-validator';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';
import { IsNotFuture } from '../../common/validators/is-not-future.validator';

export class CreateItemDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  amount: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  merchantName?: string;

  @IsOptional()
  @IsDateString()
  @IsNotFuture()
  transactionDate?: string;
}
