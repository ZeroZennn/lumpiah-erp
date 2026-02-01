import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GetAttendanceRecapDto } from './dto/get-attendance-recap.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

interface AttendanceRecapItem {
  userId: number;
  userName: string;
  branchName: string;
  totalDays: number;
  totalHours: number | string; // Allow string during final formatting or number during calc
  averageHours: string;
  missingCheckout: number;
}

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

  async getRecap(filter: GetAttendanceRecapDto) {
    const { branchId, startDate, endDate, search } = filter;

    const whereClause: Prisma.AttendanceWhereInput = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      branch: { isActive: true }, // Only active branches usually
      user: { isActive: true }, // Only active users
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    if (search) {
      whereClause.user = {
        fullname: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: true,
        branch: true,
      },
      orderBy: { user: { fullname: 'asc' } },
    });

    // Aggregation
    const groupedByUser = new Map<number, AttendanceRecapItem>();

    let grandTotalDays = 0;
    let grandTotalHours = 0;
    let grandTotalMissingCheckout = 0;

    for (const record of attendances) {
      const uId = record.userId;
      if (!groupedByUser.has(uId)) {
        groupedByUser.set(uId, {
          userId: uId,
          userName: record.user.fullname,
          branchName: record.branch.name,
          totalDays: 0,
          totalHours: 0,
          averageHours: '0.0', // Initial placeholder
          missingCheckout: 0,
        });
      }

      const entry = groupedByUser.get(uId)!;
      entry.totalDays += 1;
      grandTotalDays += 1;

      if (record.clockOut) {
        const durationMs = record.clockOut.getTime() - record.clockIn.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        // We know totalHours is number during loop
        entry.totalHours = (entry.totalHours as number) + durationHours;
        grandTotalHours += durationHours;
      } else {
        entry.missingCheckout += 1;
        grandTotalMissingCheckout += 1;
      }
    }

    const recapList = Array.from(groupedByUser.values()).map((item) => {
      const tHours = item.totalHours as number;
      item.averageHours =
        item.totalDays > 0 ? (tHours / item.totalDays).toFixed(1) : '0.0';
      item.totalHours = tHours.toFixed(1);
      return item;
    });

    // Pagination (In-Memory)
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedRecap = recapList.slice(startIndex, endIndex);

    return {
      summary: {
        totalDays: grandTotalDays,
        totalHours: grandTotalHours.toFixed(1),
        missingCheckout: grandTotalMissingCheckout,
      },
      recap: paginatedRecap,
      meta: {
        page,
        limit,
        total: recapList.length,
        totalPages: Math.ceil(recapList.length / limit),
      },
    };
  }

  async getDetails(userId: number, startDate: string, endDate: string) {
    const details = await this.prisma.attendance.findMany({
      where: {
        userId: Number(userId),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Add calculated duration field
    return details.map((d) => {
      let durationStr = '-';
      if (d.clockOut) {
        const diffMs = d.clockOut.getTime() - d.clockIn.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        durationStr = `${hours}h ${minutes}m`;
      }
      return {
        ...d,
        durationString: durationStr,
        id: d.id.toString(), // BigInt to string for JSON
      };
    });
  }

  async updateAttendance(id: number | string, dto: UpdateAttendanceDto) {
    const { clockIn, clockOut, correctionNote } = dto;

    // Validate existence
    const existing = await this.prisma.attendance.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) throw new NotFoundException('Attendance record not found');

    const dataToUpdate: Prisma.AttendanceUpdateInput = { correctionNote };
    if (clockIn) dataToUpdate.clockIn = new Date(clockIn);
    if (clockOut) dataToUpdate.clockOut = new Date(clockOut);

    const updated = await this.prisma.attendance.update({
      where: { id: BigInt(id) },
      data: dataToUpdate,
    });

    return {
      ...updated,
      id: updated.id.toString(),
    };
  }
}
