import { IsEnum, IsOptional } from 'class-validator';
import { ReportStatus } from '../../common/enums/report-status.enum';

export class FilterReportsDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
