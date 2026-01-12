import React, { useMemo, useState } from 'react';
import { AttendanceRecord, Student } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { Download, Search, Filter, ArrowUp, MoreHorizontal } from 'lucide-react';

interface ReportsProps {
  records: AttendanceRecord[];
  students: Student[];
}

const Reports: React.FC<ReportsProps> = ({ records, students }) => {
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('today');

  const filteredRecords = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (filterPeriod === 'today') {
      return records.filter(r => r.date === today);
    }
    return records;
  }, [records, filterPeriod]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const onTime = filteredRecords.filter(r => r.status === 'on-time').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const absent = Math.max(0, students.length - total); 
    const rate = students.length > 0 ? Math.round((total / students.length) * 100) : 0;

    return { total, onTime, late, absent, rate };
  }, [filteredRecords, students.length]);

  const chartData = [
    { name: 'Đúng giờ', value: stats.onTime, color: '#4cae4f' },
    { name: 'Muộn', value: stats.late, color: '#FF9500' },
    { name: 'Vắng', value: stats.absent, color: '#FF3B30' },
  ];

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = students.map((s, index) => {
        const studentRecords = records.filter(r => r.studentId === s.id);
        const onTimeCount = studentRecords.filter(r => r.status === 'on-time').length;
        return {
            "STT": index + 1,
            "Họ Tên": s.name,
            "Mã HS": s.studentId,
            "Lớp": s.className,
            "Tổng buổi": studentRecords.length,
            "Đúng giờ": onTimeCount,
            "Muộn": studentRecords.filter(r => r.status === 'late').length,
            "Tỷ lệ": studentRecords.length > 0 ? `${((onTimeCount / studentRecords.length) * 100).toFixed(0)}%` : '0%'
        };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Tổng hợp");
    XLSX.writeFile(wb, `Bao_Cao_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
         <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Báo cáo Điểm danh</h1>
            <p className="text-slate-500 mt-1">Theo dõi và phân tích xu hướng tham gia lớp học.</p>
         </div>
         <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {['today', 'week', 'month'].map((p) => (
                <button
                    key={p}
                    onClick={() => setFilterPeriod(p as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterPeriod === p ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    {p === 'today' ? 'Hôm nay' : p === 'week' ? 'Tuần này' : 'Tháng này'}
                </button>
            ))}
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng lượt quét</p>
            <div className="flex items-baseline gap-2 mt-2">
               <p className="text-3xl font-black text-slate-900">{stats.total}</p>
               <span className="text-primary text-xs font-bold flex items-center bg-green-50 px-1.5 py-0.5 rounded"><ArrowUp size={12} /> Live</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tỷ lệ tham gia</p>
            <div className="flex items-baseline gap-2 mt-2">
               <p className="text-3xl font-black text-primary">{stats.rate}%</p>
               <span className="text-slate-400 text-xs font-medium">trung bình</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Đi muộn</p>
            <div className="flex items-baseline gap-2 mt-2">
               <p className="text-3xl font-black text-orange-500">{stats.late}</p>
               <span className="text-orange-500 text-xs font-medium bg-orange-50 px-1.5 py-0.5 rounded">Cần chú ý</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Vắng mặt</p>
            <div className="flex items-baseline gap-2 mt-2">
               <p className="text-3xl font-black text-red-500">{stats.absent}</p>
               <span className="text-slate-400 text-xs font-medium">học sinh</span>
            </div>
         </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart */}
         <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Biểu đồ tổng quan</h3>
            <div className="flex-1 min-h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                      >
                          {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Table */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-slate-900">Chi tiết điểm danh</h3>
               <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-green-600 transition-colors"
               >
                  <Download size={16} /> Xuất Excel
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Họ tên</th>
                        <th className="px-6 py-4">Giờ vào</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-right">Chi tiết</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredRecords.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Chưa có dữ liệu</td></tr>
                     ) : (
                        filteredRecords.slice().reverse().map((r) => (
                           <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                       {r.studentName.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-sm text-slate-900">{r.studentName}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-slate-600">{r.time}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    r.status === 'on-time' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                 }`}>
                                    {r.status === 'on-time' ? 'Đúng giờ' : `Muộn ${r.lateMinutes}'`}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <button className="text-slate-400 hover:text-primary"><MoreHorizontal size={20} /></button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reports;