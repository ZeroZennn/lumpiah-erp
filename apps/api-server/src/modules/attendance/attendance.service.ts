import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(userId: number, branchId: number, offlineTimestamp?: string) {
    const effectiveDate = offlineTimestamp
      ? new Date(offlineTimestamp)
      : new Date();
    const note = offlineTimestamp ? 'Offline Input' : undefined;

    // Create range for the TARGET DATE (from offlineTimestamp or now)
    const targetDate = effectiveDate;

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        // Check if there is a clock-in within this day's range
        clockIn: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingAttendance) {
      if (offlineTimestamp) {
        console.log(
          'DEBUG: [clockIn] Existing record found (Idempotency). Returning ID:',
          existingAttendance.id,
        );
        return existingAttendance;
      }
      throw new BadRequestException('User already clocked in for this date');
    }

    console.log(
      'DEBUG: [clockIn] Creating new record for date:',
      effectiveDate,
    );

    return this.prisma.attendance.create({
      data: {
        userId,
        branchId,
        date: effectiveDate,
        clockIn: effectiveDate,
        correctionNote: note,
      },
    });
  }

  async clockOut(userId: number, offlineTimestamp?: string) {
    // Create range for Target Date
    const targetDate = offlineTimestamp
      ? new Date(offlineTimestamp)
      : new Date();
    const noteAppend = offlineTimestamp ? 'Offline Input' : undefined;

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    if (offlineTimestamp) {
      console.log('DEBUG: [clockOut] Target Date:', targetDate);
      console.log('DEBUG: [clockOut] Range:', startOfDay, '-', endOfDay);
    }

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        userId,
        // Check finding active session within this day range
        clockIn: {
          gte: startOfDay,
          lte: endOfDay,
        },
        clockOut: null,
      },
    });

    if (!attendance) {
      if (offlineTimestamp) {
        // If syncing offline and cant find open session, it might be already closed,
        // or we are missing the clock-in (out of order sync).
        // For safety, let's check if it was already clocked out properly today?
        // For now, adhere to "Return success to prevent stuck loop" if desired,
        // OR throw specialized error.
        // BUT request said: "Throw NotFoundException (or for sync safety, ignore/return success)"
        // I'll Log and throw NotFound for now, as missing IN is data integrity issue.
        console.log(
          'DEBUG: [clockOut] No active session found for offline sync.',
        );
      }
      throw new NotFoundException(
        'No active clock-in record found for this date to clock out from',
      );
    }

    let newNote = attendance.correctionNote;
    if (noteAppend) {
      if (newNote) {
        newNote += '; ' + noteAppend;
      } else {
        newNote = noteAppend;
      }
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: targetDate,
        correctionNote: newNote,
      },
    });
  }

  async getMyAttendance(userId: number) {
    return this.prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5, // Latest 5 records
    });
  }
}
