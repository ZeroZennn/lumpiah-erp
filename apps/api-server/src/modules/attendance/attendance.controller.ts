import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @HttpCode(HttpStatus.CREATED)
  clockIn(@Request() req: { user: { userId: number; branchId: number } }) {
    return this.attendanceService.clockIn(req.user.userId, req.user.branchId);
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  clockOut(@Request() req: { user: { userId: number } }) {
    return this.attendanceService.clockOut(req.user.userId);
  }

  @Get('me')
  getMyAttendance(@Request() req: { user: { userId: number } }) {
    return this.attendanceService.getMyAttendance(req.user.userId);
  }
}
