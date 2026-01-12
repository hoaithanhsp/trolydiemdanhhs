import { Schedule, Student, ClassGroup } from './types';

export const INITIAL_CLASSES: ClassGroup[] = [
  { id: 'CLS001', name: '10A1' },
  { id: 'CLS002', name: '10A2' },
];

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'SCH001',
    name: 'Sáng',
    startTime: '07:00',
    graceMinutes: 15,
  },
  {
    id: 'SCH002',
    name: 'Chiều',
    startTime: '13:00',
    graceMinutes: 15,
  },
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'HS001',
    name: 'Nguyễn Văn A',
    studentId: '2024001',
    className: '10A1',
    dateOfBirth: '15/05/2008',
    qrContent: JSON.stringify({ id: 'HS001', name: 'Nguyễn Văn A', studentId: '2024001', class: '10A1' }),
  },
  {
    id: 'HS002',
    name: 'Trần Thị B',
    studentId: '2024002',
    className: '10A1',
    dateOfBirth: '20/10/2008',
    qrContent: JSON.stringify({ id: 'HS002', name: 'Trần Thị B', studentId: '2024002', class: '10A1' }),
  },
  {
    id: 'HS003',
    name: 'Lê Văn C',
    studentId: '2024003',
    className: '10A2',
    dateOfBirth: '01/01/2008',
    qrContent: JSON.stringify({ id: 'HS003', name: 'Lê Văn C', studentId: '2024003', class: '10A2' }),
  },
];

export const INITIAL_SETTINGS = {
  className: 'Lớp 10A1',
  schoolYear: '2025-2026',
};