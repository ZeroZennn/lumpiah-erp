import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllTransactionsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  branchId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string; // UUID or Cashier Name

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isOfflineSynced?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 10;
}
