import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsDateString()
  clockIn?: string;

  @IsOptional()
  @IsDateString()
  clockOut?: string;

  @IsNotEmpty()
  @IsString()
  correctionNote: string;
}
