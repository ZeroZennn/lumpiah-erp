import { IsOptional, IsInt, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAttendanceRecapDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  branchId?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 10;
}
