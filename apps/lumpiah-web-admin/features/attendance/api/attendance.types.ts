/**
 * Attendance Feature Types
 * Based on Prisma Attendance model
 */

export interface Attendance {
  id: number;
  branchId: number;
  userId: number;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  photoIn: string | null;
  photoOut: string | null;
  latIn: number | null;
  lngIn: number | null;
  latOut: number | null;
  lngOut: number | null;
  status: AttendanceStatus;
  branchName?: string;
  userName?: string;
}

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE";

export interface AttendanceSummary {
  userId: number;
  userName: string;
  branchName: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
  workDays: number;
  attendanceRate: number;
}
