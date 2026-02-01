import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { ClockOutDto } from './dto/clock-out.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @HttpCode(HttpStatus.CREATED)
  clockIn(
    @Request() req: { user: { userId: number; branchId: number } },
    @Body() createAttendanceDto: CreateAttendanceDto,
  ) {
    console.log('DEBUG: [clockIn] Payload:', createAttendanceDto);
    return this.attendanceService.clockIn(
      req.user.userId,
      req.user.branchId,
      createAttendanceDto.offlineTimestamp,
    );
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  clockOut(
    @Request() req: { user: { userId: number } },
    @Body() clockOutDto: ClockOutDto,
  ) {
    return this.attendanceService.clockOut(
      req.user.userId,
      clockOutDto.offlineTimestamp,
    );
  }

  @Get('me')
  getMyAttendance(@Request() req: { user: { userId: number } }) {
    return this.attendanceService.getMyAttendance(req.user.userId);
  }
}
