import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
