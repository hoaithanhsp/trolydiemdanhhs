import React, { useState } from 'react';
import { Schedule } from '../types';
import { Clock, Trash2, Plus, Save, Sun, Moon, Edit } from 'lucide-react';

interface SettingsProps {
  schedules: Schedule[];
  onUpdateSchedules: (schedules: Schedule[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ schedules, onUpdateSchedules }) => {
  const [localSchedules, setLocalSchedules] = useState<Schedule[]>(schedules);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({ name: '', startTime: '07:00', graceMinutes: 5 });

  const handleDelete = (id: string) => {
    if(window.confirm('Bạn có chắc muốn xóa ca học này?')) {
        const updated = localSchedules.filter(s => s.id !== id);
        setLocalSchedules(updated);
        onUpdateSchedules(updated);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newSchedule.name && newSchedule.startTime) {
          const schedule: Schedule = {
              id: `SCH_${Date.now()}`,
              name: newSchedule.name,
              startTime: newSchedule.startTime,
              graceMinutes: newSchedule.graceMinutes || 0
          };
          const updated = [...localSchedules, schedule];
          setLocalSchedules(updated);
          onUpdateSchedules(updated);
          setShowAddForm(false);
          setNewSchedule({ name: '', startTime: '07:00', graceMinutes: 5 });
      }
  };

  return (
    <div className="space-y-8">
       {/* Header */}
       <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt giờ học</h2>
             <p className="text-slate-500 mt-1">Quản lý các ca học và thời gian điểm danh cố định.</p>
          </div>
          <button 
             onClick={() => setShowAddForm(true)}
             className="bg-primary hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/20"
          >
             <Plus size={20} /> Thêm ca học
          </button>
       </div>

       {/* Schedule Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localSchedules.map((schedule, idx) => (
             <div key={schedule.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col transition-all hover:shadow-md group">
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-lg ${idx % 2 === 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {idx % 2 === 0 ? <Sun className="text-primary" /> : <Moon className="text-orange-500" />}
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(schedule.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                   </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{schedule.name}</h3>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-slate-500">
                      <Clock size={18} />
                      <span className="text-sm">Bắt đầu: <strong className="text-slate-900">{schedule.startTime}</strong></span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-[18px] text-center font-bold text-xs border rounded border-slate-300">+</div>
                      <span className="text-sm">Gia hạn: <strong className="text-slate-900">{schedule.graceMinutes} phút</strong></span>
                   </div>
                </div>
             </div>
          ))}

          {/* Empty/Add Placeholder */}
          <div 
            onClick={() => setShowAddForm(true)}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-all min-h-[200px]"
          >
             <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400 group-hover:text-primary">
                <Plus size={24} />
             </div>
             <p className="text-sm font-medium text-slate-500">Thêm ca học khác</p>
          </div>
       </div>

       {/* Add Modal */}
       {showAddForm && (
           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                   <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
                       <h2 className="text-xl font-bold text-slate-900">Thêm ca học mới</h2>
                       <p className="text-sm text-slate-500 mt-1">Điền thông tin chi tiết cho ca học của bạn.</p>
                   </div>
                   <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                       <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-2">Tên ca học</label>
                           <input 
                              type="text" 
                              required
                              placeholder="Ví dụ: Ca Sáng, Ca Chiều"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                              value={newSchedule.name}
                              onChange={e => setNewSchedule({...newSchedule, name: e.target.value})}
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                           <div>
                               <label className="block text-sm font-semibold text-slate-700 mb-2">Giờ bắt đầu</label>
                               <input 
                                  type="time" 
                                  required
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                  value={newSchedule.startTime}
                                  onChange={e => setNewSchedule({...newSchedule, startTime: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-semibold text-slate-700 mb-2">Gia hạn (phút)</label>
                               <input 
                                  type="number" 
                                  required
                                  min="0"
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                                  value={newSchedule.graceMinutes}
                                  onChange={e => setNewSchedule({...newSchedule, graceMinutes: parseInt(e.target.value)})}
                               />
                           </div>
                       </div>
                       <div className="flex justify-end gap-3 pt-2">
                           <button 
                             type="button" 
                             onClick={() => setShowAddForm(false)}
                             className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                           >
                             Hủy bỏ
                           </button>
                           <button 
                             type="submit"
                             className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                           >
                             Lưu ca học
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

export default Settings;