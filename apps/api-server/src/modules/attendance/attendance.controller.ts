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
import { GetAttendanceRecapDto } from './dto/get-attendance-recap.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Query, Param, Patch } from '@nestjs/common';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Get('recap')
  @Roles('Admin', 'Owner')
  getRecap(@Query() query: GetAttendanceRecapDto) {
    return this.attendanceService.getRecap(query);
  }

  @Get('details/:userId')
  @Roles('Admin', 'Owner')
  getDetails(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getDetails(
      Number(userId),
      startDate,
      endDate,
    );
  }

  @Patch(':id')
  @Roles('Admin')
  updateAttendance(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.updateAttendance(id, updateAttendanceDto);
  }
}
