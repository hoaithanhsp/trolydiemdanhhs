// Lịch sử điểm danh của từng học sinh
export interface StudentAttendanceRecord {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm:ss
  scheduleName: string;
  status: AttendanceStatus;
  lateMinutes: number;
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  className: string;
  dateOfBirth?: string; // DD/MM/YYYY
  qrContent: string; // The JSON string stored in the QR
  attendanceHistory?: StudentAttendanceRecord[]; // Lịch sử điểm danh
}

export interface ClassGroup {
  id: string;
  name: string;
}

export interface Schedule {
  id: string;
  name: string;
  startTime: string; // HH:mm
  graceMinutes: number;
}

export type AttendanceStatus = 'on-time' | 'late';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string; // Mã HS
  className: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  scheduleId: string;
  scheduleName: string;
  status: AttendanceStatus;
  lateMinutes: number;
}

export interface AppSettings {
  className: string;
  schoolYear: string;
}

export type ViewState = 'students' | 'scan' | 'reports' | 'settings';