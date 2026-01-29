/**
 * Attendance Dummy Data
 * Based on Prisma schema - ready for API integration
 */

import { Attendance, AttendanceSummary } from "../api/attendance.types";

export const attendanceRecords: Attendance[] = [
  // Cabang Pusat - Today
  {
    id: 1,
    branchId: 1,
    userId: 2,
    date: "2025-01-29",
    clockIn: "2025-01-29T07:55:00Z",
    clockOut: "2025-01-29T16:05:00Z",
    photoIn: null,
    photoOut: null,
    latIn: -6.2088,
    lngIn: 106.8456,
    latOut: -6.2088,
    lngOut: 106.8456,
    status: "PRESENT",
    branchName: "Cabang Pusat",
    userName: "Budi Sudrajat",
  },
  {
    id: 2,
    branchId: 1,
    userId: 3,
    date: "2025-01-29",
    clockIn: "2025-01-29T08:15:00Z",
    clockOut: null,
    photoIn: null,
    photoOut: null,
    latIn: -6.2088,
    lngIn: 106.8456,
    latOut: null,
    lngOut: null,
    status: "LATE",
    branchName: "Cabang Pusat",
    userName: "Sari Wulandari",
  },
  // Cabang Timur
  {
    id: 3,
    branchId: 2,
    userId: 5,
    date: "2025-01-29",
    clockIn: "2025-01-29T07:50:00Z",
    clockOut: null,
    photoIn: null,
    photoOut: null,
    latIn: -6.2345,
    lngIn: 106.9876,
    latOut: null,
    lngOut: null,
    status: "PRESENT",
    branchName: "Cabang Timur",
    userName: "Andi Pratama",
  },
  {
    id: 4,
    branchId: 2,
    userId: 6,
    date: "2025-01-29",
    clockIn: null,
    clockOut: null,
    photoIn: null,
    photoOut: null,
    latIn: null,
    lngIn: null,
    latOut: null,
    lngOut: null,
    status: "ABSENT",
    branchName: "Cabang Timur",
    userName: "Dewi Anggraini",
  },
  // Cabang Barat
  {
    id: 5,
    branchId: 3,
    userId: 7,
    date: "2025-01-29",
    clockIn: "2025-01-29T07:45:00Z",
    clockOut: null,
    photoIn: null,
    photoOut: null,
    latIn: -6.1876,
    lngIn: 106.7654,
    latOut: null,
    lngOut: null,
    status: "PRESENT",
    branchName: "Cabang Barat",
    userName: "Rudi Hermawan",
  },
  {
    id: 6,
    branchId: 3,
    userId: 8,
    date: "2025-01-29",
    clockIn: null,
    clockOut: null,
    photoIn: null,
    photoOut: null,
    latIn: null,
    lngIn: null,
    latOut: null,
    lngOut: null,
    status: "LEAVE",
    branchName: "Cabang Barat",
    userName: "Maya Putri",
  },
  // Cabang Depok
  {
    id: 7,
    branchId: 5,
    userId: 9,
    date: "2025-01-29",
    clockIn: "2025-01-29T08:00:00Z",
    clockOut: null,
    photoIn: null,
    photoOut: null,
    latIn: -6.4025,
    lngIn: 106.7942,
    latOut: null,
    lngOut: null,
    status: "PRESENT",
    branchName: "Cabang Depok",
    userName: "Joko Widodo",
  },
];

export const attendanceSummary: AttendanceSummary[] = [
  {
    userId: 2,
    userName: "Budi Sudrajat",
    branchName: "Cabang Pusat",
    present: 20,
    late: 2,
    absent: 0,
    leave: 1,
    workDays: 23,
    attendanceRate: 95.7,
  },
  {
    userId: 3,
    userName: "Sari Wulandari",
    branchName: "Cabang Pusat",
    present: 18,
    late: 4,
    absent: 1,
    leave: 0,
    workDays: 23,
    attendanceRate: 82.6,
  },
  {
    userId: 5,
    userName: "Andi Pratama",
    branchName: "Cabang Timur",
    present: 22,
    late: 1,
    absent: 0,
    leave: 0,
    workDays: 23,
    attendanceRate: 100,
  },
  {
    userId: 6,
    userName: "Dewi Anggraini",
    branchName: "Cabang Timur",
    present: 19,
    late: 3,
    absent: 1,
    leave: 0,
    workDays: 23,
    attendanceRate: 86.9,
  },
  {
    userId: 7,
    userName: "Rudi Hermawan",
    branchName: "Cabang Barat",
    present: 21,
    late: 2,
    absent: 0,
    leave: 0,
    workDays: 23,
    attendanceRate: 100,
  },
  {
    userId: 8,
    userName: "Maya Putri",
    branchName: "Cabang Barat",
    present: 17,
    late: 3,
    absent: 2,
    leave: 1,
    workDays: 23,
    attendanceRate: 78.3,
  },
  {
    userId: 9,
    userName: "Joko Widodo",
    branchName: "Cabang Depok",
    present: 20,
    late: 1,
    absent: 0,
    leave: 2,
    workDays: 23,
    attendanceRate: 91.3,
  },
];

export function formatTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "PRESENT":
      return "bg-emerald-500";
    case "LATE":
      return "bg-amber-500";
    case "ABSENT":
      return "bg-red-500";
    case "LEAVE":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "PRESENT":
      return "Hadir";
    case "LATE":
      return "Terlambat";
    case "ABSENT":
      return "Tidak Hadir";
    case "LEAVE":
      return "Cuti/Izin";
    default:
      return status;
  }
}
