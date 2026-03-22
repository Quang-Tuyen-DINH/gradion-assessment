import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
