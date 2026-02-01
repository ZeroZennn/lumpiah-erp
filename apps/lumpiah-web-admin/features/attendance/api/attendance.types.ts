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

export interface AttendanceRecapResponse {
  summary: AttendanceSummary;
  recap: AttendanceRecapItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendanceRecapItem {
  userId: number;
  userName: string;
  branchName: string;
  totalDays: number;
  totalHours: string;
  averageHours: string;
  missingCheckout: number;
}

export interface AttendanceDetailItem {
  id: string; // BigInt serialized to string
  userId: number;
  branchId: number;
  date: string;
  clockIn: string;
  clockOut: string | null;
  correctionNote: string | null;
  durationString: string;
}

export interface UpdateAttendanceRequest {
  clockIn?: string;
  clockOut?: string;
  correctionNote: string;
}

// Deprecated or keep for compatibility if needed, but updated to match usage
export interface AttendanceSummary {
    totalDays: number;
    totalHours: string;
    missingCheckout: number;
}
