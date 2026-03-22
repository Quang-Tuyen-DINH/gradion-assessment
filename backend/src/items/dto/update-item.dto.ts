import { IsNumber, Min, IsOptional, IsString, MaxLength, IsEnum, IsDateString } from 'class-validator';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';

export class UpdateItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  merchantName?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;
}
