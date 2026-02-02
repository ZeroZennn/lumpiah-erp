import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsOptional()
  @IsString()
  @IsISO8601()
  offlineTimestamp?: string;
}
