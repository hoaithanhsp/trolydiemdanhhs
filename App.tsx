import React, { useEffect, useState } from 'react';
import { Users, ScanLine, BarChart3, Settings as SettingsIcon, QrCode, LogOut } from 'lucide-react';
import { Student, Schedule, AttendanceRecord, ViewState, ClassGroup } from './types';
import { MOCK_STUDENTS, INITIAL_SCHEDULES, INITIAL_CLASSES } from './constants';
import StudentManager from './components/StudentManager';
import Scanner from './components/Scanner';
import Reports from './components/Reports';
import Settings from './components/Settings';

function App() {
  // State Management
  const [activeTab, setActiveTab] = useState<ViewState>('students');
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  // Data State (Initialize from LocalStorage or constants)
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    const saved = localStorage.getItem('classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students');
    return saved ? JSON.parse(saved) : MOCK_STUDENTS;
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('attendanceRecords');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem('classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords)); }, [attendanceRecords]);

  // Handlers (kept same as before)
  const handleAddStudent = (student: Student) => setStudents([...students, student]);
  const handleUpdateStudent = (student: Student) => setStudents(students.map(s => s.id === student.id ? student : s));
  const handleDeleteStudent = (id: string) => setStudents(students.filter(s => s.id !== id));

  const handleAddClass = (newClass: ClassGroup) => setClasses([...classes, newClass]);
  const handleUpdateClass = (updatedClass: ClassGroup) => {
    const oldClass = classes.find(c => c.id === updatedClass.id);
    if (oldClass && oldClass.name !== updatedClass.name) {
      const updatedStudents = students.map(s => s.className === oldClass.name ? { ...s, className: updatedClass.name, qrContent: s.qrContent.replace(oldClass.name, updatedClass.name) } : s);
      setStudents(updatedStudents);
    }
    setClasses(classes.map(c => c.id === updatedClass.id ? updatedClass : c));
  };
  const handleDeleteClass = (id: string) => {
    const classToDelete = classes.find(c => c.id === id);
    if (classToDelete) {
      setStudents(students.filter(s => s.className !== classToDelete.name));
    }
    setClasses(classes.filter(c => c.id !== id));
  };

  const handleImportStudents = (newStudents: Student[], newClasses: ClassGroup[]) => {
    if (newClasses.length > 0) {
      setClasses([...classes, ...newClasses]);
    }
    setStudents([...students, ...newStudents]);
  };

  const handleScan = (record: AttendanceRecord) => {
    setAttendanceRecords([...attendanceRecords, record]);

    // Lưu vào lịch sử điểm danh của học sinh
    const updatedStudents = students.map(s => {
      if (s.id === record.studentId) {
        const historyRecord = {
          date: record.date,
          time: record.time,
          scheduleName: record.scheduleName,
          status: record.status,
          lateMinutes: record.lateMinutes
        };
        return {
          ...s,
          attendanceHistory: [...(s.attendanceHistory || []), historyRecord]
        };
      }
      return s;
    });
    setStudents(updatedStudents);
  };
  const handleUpdateSchedules = (newSchedules: Schedule[]) => setSchedules(newSchedules);

  return (
    <div className="flex min-h-screen bg-background-light font-sans text-slate-900">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-2 flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <QrCode size={28} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-tight">QR Attend</h1>
              <p className="text-slate-500 text-xs mt-1 font-medium">Hệ thống quản lý</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-2">
          <SidebarLink
            active={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
            icon={<Users size={20} />}
            label="Học sinh"
          />
          <SidebarLink
            active={activeTab === 'scan'}
            onClick={() => setActiveTab('scan')}
            icon={<ScanLine size={20} />}
            label="Điểm danh"
          />
          <SidebarLink
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            icon={<BarChart3 size={20} />}
            label="Báo cáo"
          />
          <SidebarLink
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<SettingsIcon size={20} />}
            label="Cài đặt"
          />
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div
            onClick={() => setShowTeacherModal(true)}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <img
              src="/teacher-photo.jpg"
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-primary"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Trần Thị Kim Thoa</p>
              <p className="text-xs text-slate-500 truncate">THPT Hoàng Diệu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 w-full relative">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5 text-white">
              <QrCode size={20} />
            </div>
            <span className="font-bold text-lg">QR Attend</span>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">
          {activeTab === 'students' && (
            <StudentManager
              students={students}
              classes={classes}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onImportStudents={handleImportStudents}
              onAddClass={handleAddClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
            />
          )}
          {activeTab === 'scan' && (
            <Scanner
              students={students}
              schedules={schedules}
              onScan={handleScan}
              existingRecords={attendanceRecords}
            />
          )}
          {activeTab === 'reports' && (
            <Reports records={attendanceRecords} students={students} />
          )}
          {activeTab === 'settings' && (
            <Settings schedules={schedules} onUpdateSchedules={handleUpdateSchedules} />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          <NavButton
            active={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
            icon={<Users size={24} />}
            label="Học sinh"
          />
          <NavButton
            active={activeTab === 'scan'}
            onClick={() => setActiveTab('scan')}
            icon={<ScanLine size={24} />}
            label="Điểm danh"
            isPrimary
          />
          <NavButton
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            icon={<BarChart3 size={24} />}
            label="Báo cáo"
          />
          <NavButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<SettingsIcon size={24} />}
            label="Cài đặt"
          />
        </div>
      </nav>

      {/* Teacher Info Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-center relative">
              <button
                onClick={() => setShowTeacherModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
              <img
                src="/teacher-avatar.jpg"
                alt="Cô giáo Trần Thị Kim Thoa"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-xl"
              />
              <h3 className="text-2xl font-bold text-white">Trần Thị Kim Thoa</h3>
              <p className="text-blue-200 font-medium mt-1">Giáo viên</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Trường</p>
                  <p className="font-bold text-slate-900">Trường Trung học Phổ thông Hoàng Diệu</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Địa chỉ</p>
                  <p className="font-bold text-slate-900">Số 1 Mạc Đĩnh Chi, phường Phú Lợi, thành phố Cần Thơ</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowTeacherModal(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SidebarLink = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${active
      ? 'bg-primary text-white shadow-lg shadow-primary/30'
      : 'text-slate-600 hover:bg-slate-100'
      }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

const NavButton = ({ active, onClick, icon, label, isPrimary }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isPrimary?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${active ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
      }`}
  >
    <div className={`mb-1 transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
