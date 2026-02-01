import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDailyClosingDto {
  @IsNumber()
  @Min(0)
  totalCashActual: number;

  @IsNumber()
  @Min(0)
  totalQrisActual: number;

  @IsOptional()
  @IsString()
  closingNote?: string;
}
