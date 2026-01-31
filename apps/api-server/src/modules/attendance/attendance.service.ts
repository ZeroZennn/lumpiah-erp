import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(userId: number, branchId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: today,
        },
      },
    });

    if (existingAttendance) {
      throw new BadRequestException('User already clocked in today');
    }

    // Default shiftId null for now, or fetch if needed
    return this.prisma.attendance.create({
      data: {
        userId,
        branchId,
        date: new Date(), // Using simple date, but storing full timestamp in clockIn
        clockIn: new Date(),
        // clockOut is null by default
      },
    });
  }

  async clockOut(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: today,
        },
        clockOut: null,
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        'No active clock-in record found for today to clock out from',
      );
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: new Date(),
      },
    });
  }

  async getMyAttendance(userId: number) {
    return this.prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30, // Last 30 records
    });
  }
}
