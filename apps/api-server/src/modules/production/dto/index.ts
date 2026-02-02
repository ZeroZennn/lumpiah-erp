import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SubmitRealizationDto {
  @IsInt()
  planId: number;

  @IsInt()
  @Min(0)
  actualQty: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export class GetAccuracyReportDto {
  branchId: number;
  date: string; // ISO Date
}
