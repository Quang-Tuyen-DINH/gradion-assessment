import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
