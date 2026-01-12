import React, { useState, useRef, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { Download, Edit2, FileSpreadsheet, Plus, Trash2, Search, X, Settings, ChevronDown, Filter, MoreHorizontal, QrCode as QrIcon, History, FileDown, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Student, ClassGroup, StudentAttendanceRecord } from '../types';

interface StudentManagerProps {
   students: Student[];
   classes?: ClassGroup[];
   onAddStudent: (student: Student) => void;
   onUpdateStudent: (student: Student) => void;
   onDeleteStudent: (id: string) => void;
   onImportStudents: (students: Student[], newClasses: ClassGroup[]) => void;
   onAddClass?: (newClass: ClassGroup) => void;
   onUpdateClass?: (updatedClass: ClassGroup) => void;
   onDeleteClass?: (classId: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({
   students,
   classes = [],
   onAddStudent,
   onUpdateStudent,
   onDeleteStudent,
   onImportStudents,
   onAddClass,
   onUpdateClass,
   onDeleteClass,
}) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

   // Modals
   const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
   const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
   const [viewQR, setViewQR] = useState<Student | null>(null);
   const [viewHistoryStudent, setViewHistoryStudent] = useState<Student | null>(null);
   const [isBatchDownloading, setIsBatchDownloading] = useState(false);

   // Edit States
   const [editingStudent, setEditingStudent] = useState<Student | null>(null);
   const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

   // Forms
   const [studentForm, setStudentForm] = useState({ name: '', studentId: '', className: '', dateOfBirth: '' });
   const [classForm, setClassForm] = useState({ name: '' });

   const fileInputRef = useRef<HTMLInputElement>(null);

   const activeClass = classes.find(c => c.id === selectedClassId) || classes[0];

   const filteredStudents = useMemo(() => {
      return students.filter((s) => {
         const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.includes(searchTerm);
         const matchesClass = activeClass ? s.className === activeClass.name : true;
         return matchesSearch && matchesClass;
      });
   }, [students, searchTerm, activeClass]);

   // --- Student Management Logic ---
   const handleOpenStudentModal = (student?: Student) => {
      if (student) {
         setEditingStudent(student);
         setStudentForm({
            name: student.name,
            studentId: student.studentId,
            className: student.className,
            dateOfBirth: student.dateOfBirth || '',
         });
      } else {
         setEditingStudent(null);
         setStudentForm({
            name: '',
            studentId: '',
            className: activeClass ? activeClass.name : '',
            dateOfBirth: ''
         });
      }
      setIsStudentModalOpen(true);
   };

   const handleSaveStudent = () => {
      if (!studentForm.name || !studentForm.studentId || !studentForm.className) return;

      const qrData = {
         id: editingStudent ? editingStudent.id : `HS${Date.now()}`,
         name: studentForm.name,
         studentId: studentForm.studentId,
         class: studentForm.className,
      };

      const newStudentData: Student = {
         id: qrData.id,
         name: studentForm.name,
         studentId: studentForm.studentId,
         className: studentForm.className,
         dateOfBirth: studentForm.dateOfBirth,
         qrContent: JSON.stringify(qrData),
      };

      if (editingStudent) {
         onUpdateStudent({ ...editingStudent, ...newStudentData });
      } else {
         onAddStudent(newStudentData);
      }
      setIsStudentModalOpen(false);
   };

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
         const bstr = evt.target?.result;
         const wb = XLSX.read(bstr, { type: 'binary' });
         const wsname = wb.SheetNames[0];
         const ws = wb.Sheets[wsname];
         const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'dd/mm/yyyy' }) as any[];

         const newStudents: Student[] = [];
         const potentialNewClasses = new Set<string>();

         data.forEach((row: any, index) => {
            const name = row['Họ và tên'] || row['Họ tên'] || row['Name'] || row['name'];
            const stId = row['Mã số học sinh'] || row['Mã HS'] || row['Mã học sinh'] || row['MSSV'] || row['StudentId'] || row['Code'];
            const cls = row['Lớp'] || row['Lớp học'] || row['Class'] || row['class'];
            const dob = row['Ngày sinh'] || row['DateOfBirth'] || row['DOB'] || '';

            if (name && stId && cls) {
               const cleanClass = String(cls).trim();
               potentialNewClasses.add(cleanClass);
               newStudents.push({
                  id: `HS_IMP_${Date.now()}_${index}`,
                  name: String(name),
                  studentId: String(stId),
                  className: cleanClass,
                  dateOfBirth: String(dob),
                  qrContent: JSON.stringify({
                     id: `HS_IMP_${Date.now()}_${index}`,
                     name: String(name),
                     studentId: String(stId),
                     class: cleanClass
                  }),
               });
            }
         });

         const existingClassNames = new Set(classes.map(c => c.name));
         const classesToCreate: ClassGroup[] = [];
         potentialNewClasses.forEach(clsName => {
            if (!existingClassNames.has(clsName)) {
               classesToCreate.push({ id: `CLS_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name: clsName });
            }
         });

         onImportStudents(newStudents, classesToCreate);
         alert(`Đã nhập ${newStudents.length} học sinh${classesToCreate.length > 0 ? ` và tạo ${classesToCreate.length} lớp mới` : ''}.`);
      };
      reader.readAsBinaryString(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
   };

   const handleSaveClass = () => {
      if (!classForm.name || !onAddClass || !onUpdateClass) return;
      if (editingClass) {
         onUpdateClass({ ...editingClass, name: classForm.name });
         setEditingClass(null);
      } else {
         onAddClass({ id: `CLS_${Date.now()}`, name: classForm.name });
      }
      setClassForm({ name: '' });
   };

   const handleEditClassInit = (cls: ClassGroup) => {
      setEditingClass(cls);
      setClassForm({ name: cls.name });
   };

   // Tải hàng loạt QR của tất cả học sinh trong lớp
   const handleBatchDownloadQR = async () => {
      if (filteredStudents.length === 0) {
         alert('Không có học sinh nào trong lớp để tải QR!');
         return;
      }

      setIsBatchDownloading(true);

      try {
         const pdf = new jsPDF('p', 'mm', 'a4');
         const pageWidth = 210;
         const pageHeight = 297;
         const margin = 15;
         const qrSize = 50;
         const cols = 3;
         const rows = 4;
         const cellWidth = (pageWidth - 2 * margin) / cols;
         const cellHeight = (pageHeight - 2 * margin) / rows;

         for (let i = 0; i < filteredStudents.length; i++) {
            const student = filteredStudents[i];
            const col = i % cols;
            const row = Math.floor((i % (cols * rows)) / cols);

            // Thêm trang mới nếu cần
            if (i > 0 && i % (cols * rows) === 0) {
               pdf.addPage();
            }

            const x = margin + col * cellWidth;
            const y = margin + row * cellHeight;

            // Tạo QR code dưới dạng canvas
            const qrElement = document.getElementById(`qr-hidden-${student.id}`);
            if (qrElement) {
               const svgData = new XMLSerializer().serializeToString(qrElement);
               const canvas = document.createElement('canvas');
               canvas.width = 256;
               canvas.height = 256;
               const ctx = canvas.getContext('2d');
               const img = new Image();

               await new Promise<void>((resolve) => {
                  img.onload = () => {
                     ctx?.drawImage(img, 0, 0);
                     const imgData = canvas.toDataURL('image/png');
                     pdf.addImage(imgData, 'PNG', x + (cellWidth - qrSize) / 2, y + 5, qrSize, qrSize);

                     // Thêm tên và mã học sinh
                     pdf.setFontSize(9);
                     pdf.setFont('helvetica', 'bold');
                     const textX = x + cellWidth / 2;
                     pdf.text(student.name, textX, y + qrSize + 12, { align: 'center' });
                     pdf.setFont('helvetica', 'normal');
                     pdf.text(`Mã: ${student.studentId}`, textX, y + qrSize + 17, { align: 'center' });
                     resolve();
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
               });
            }
         }

         pdf.save(`QR-${activeClass?.name || 'LopHoc'}.pdf`);
      } catch (error) {
         console.error('Error generating PDF:', error);
         alert('Có lỗi khi tạo file PDF!');
      } finally {
         setIsBatchDownloading(false);
      }
   };

   return (
      <div className="space-y-6 pb-20 md:pb-0">
         {/* Breadcrumbs */}
         <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 hover:text-primary transition-colors cursor-pointer">Dashboard</span>
            <span className="text-slate-400">/</span>
            <div className="relative group">
               <button
                  onClick={() => setIsClassManagerOpen(true)}
                  className="flex items-center gap-1 font-semibold text-slate-900 hover:text-primary"
               >
                  {activeClass ? activeClass.name : 'Chọn lớp'}
                  <ChevronDown className="w-4 h-4" />
               </button>
            </div>
         </div>

         {/* Page Heading & Actions */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Danh sách Học sinh</h2>
               <p className="text-slate-500 mt-1">Quản lý thông tin và mã QR của học sinh lớp {activeClass?.name}.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 h-12 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm transition-all hover:bg-blue-100"
               >
                  <FileSpreadsheet size={18} />
                  <span>Nhập Excel</span>
               </button>
               <button
                  onClick={handleBatchDownloadQR}
                  disabled={isBatchDownloading || filteredStudents.length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 h-12 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm transition-all hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <FileDown size={18} />
                  <span>{isBatchDownloading ? 'Đang tải...' : 'Tải QR'}</span>
               </button>
               <button
                  onClick={() => handleOpenStudentModal()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-primary text-white font-bold text-sm transition-all hover:bg-green-600 shadow-lg shadow-green-500/20"
               >
                  <Plus size={18} />
                  <span>Thêm HS</span>
               </button>
               <input type="file" accept=".xlsx, .csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-500 text-sm font-medium">Sĩ số lớp</p>
                  <div className="bg-green-100 text-primary p-1.5 rounded-lg"><Settings size={16} /></div>
               </div>
               <p className="text-3xl font-black text-slate-900">{filteredStudents.length}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-500 text-sm font-medium">Mã QR đã tạo</p>
                  <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><QrIcon size={16} /></div>
               </div>
               <p className="text-3xl font-black text-slate-900">{filteredStudents.length}</p>
            </div>
         </div>

         {/* Toolbar & Table */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                     type="text"
                     placeholder="Tìm kiếm tên hoặc mã số..."
                     className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex gap-2 self-end md:self-auto">
                  <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
                     <Filter size={20} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
                     <Download size={20} />
                  </button>
               </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4">Mã HS</th>
                        <th className="px-6 py-4">Lớp</th>
                        <th className="px-6 py-4">Ngày sinh</th>
                        <th className="px-6 py-4 text-center">Trạng thái QR</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredStudents.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Không tìm thấy học sinh nào.</td>
                        </tr>
                     ) : (
                        filteredStudents.map((student) => (
                           <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm">
                                       {student.name.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-slate-900">{student.name}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium font-mono text-xs">{student.studentId}</td>
                              <td className="px-6 py-4 text-slate-600">{student.className}</td>
                              <td className="px-6 py-4 text-slate-600 text-sm">{student.dateOfBirth || '--'}</td>
                              <td className="px-6 py-4 text-center">
                                 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                       onClick={() => setViewQR(student)}
                                       className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                                       title="Xem QR"
                                    >
                                       <QrIcon size={18} />
                                    </button>
                                    <button
                                       onClick={() => setViewHistoryStudent(student)}
                                       className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg"
                                       title="Xem lịch sử điểm danh"
                                    >
                                       <History size={18} />
                                    </button>
                                    <button
                                       onClick={() => handleOpenStudentModal(student)}
                                       className="p-1.5 text-slate-400 hover:text-primary hover:bg-green-50 rounded-lg"
                                       title="Sửa"
                                    >
                                       <Edit2 size={18} />
                                    </button>
                                    <button
                                       onClick={() => onDeleteStudent(student.id)}
                                       className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                       title="Xóa"
                                    >
                                       <Trash2 size={18} />
                                    </button>
                                 </div>
                                 <div className="hidden">
                                    <QRCode id={`qr-hidden-${student.id}`} value={student.qrContent} size={256} />
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination (Visual only for now) */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
               <p className="text-sm text-slate-500">Hiển thị {filteredStudents.length} kết quả</p>
               <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm text-slate-400 hover:bg-slate-100 rounded-lg" disabled>Trước</button>
                  <button className="px-3 py-1 text-sm bg-primary text-white rounded-lg font-bold">1</button>
                  <button className="px-3 py-1 text-sm text-slate-400 hover:bg-slate-100 rounded-lg">Sau</button>
               </div>
            </div>
         </div>

         {/* --- Class Manager Modal --- */}
         {isClassManagerOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                     <h2 className="text-xl font-bold text-gray-900">Quản lý Lớp học</h2>
                     <button onClick={() => setIsClassManagerOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  <div className="p-6 overflow-y-auto">
                     <div className="flex gap-2 mb-6">
                        <input
                           type="text"
                           placeholder="Tên lớp (VD: 10A3)"
                           className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                           value={classForm.name}
                           onChange={(e) => setClassForm({ name: e.target.value })}
                        />
                        <button
                           onClick={handleSaveClass}
                           className={`px-4 py-2 rounded-xl text-white font-medium text-sm transition-colors shadow-lg ${editingClass ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-green-600'
                              }`}
                        >
                           {editingClass ? 'Lưu' : 'Thêm'}
                        </button>
                     </div>
                     <div className="space-y-2">
                        {classes.map(cls => (
                           <div
                              key={cls.id}
                              onClick={() => { setSelectedClassId(cls.id); setIsClassManagerOpen(false); }}
                              className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedClassId === cls.id
                                 ? 'bg-green-50 border-green-200 ring-1 ring-green-200'
                                 : 'bg-white border-gray-100 hover:border-gray-300'
                                 }`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-2 h-2 rounded-full ${selectedClassId === cls.id ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                 <span className={`font-medium ${selectedClassId === cls.id ? 'text-primary' : 'text-gray-700'}`}>
                                    {cls.name}
                                 </span>
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                 <button onClick={() => handleEditClassInit(cls)} className="p-1.5 text-gray-400 hover:text-orange-500"><Edit2 size={16} /></button>
                                 <button
                                    onClick={() => {
                                       if (window.confirm(`Xóa lớp ${cls.name}?`)) {
                                          if (onDeleteClass) onDeleteClass(cls.id);
                                          if (selectedClassId === cls.id) setSelectedClassId('');
                                       }
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500"
                                 ><Trash2 size={16} /></button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* --- Student Add/Edit Modal (Matching visual style) --- */}
         {isStudentModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
                     <h2 className="text-xl font-bold text-slate-900">{editingStudent ? 'Sửa thông tin' : 'Thêm học sinh mới'}</h2>
                     <p className="text-sm text-slate-500 mt-1">Điền thông tin chi tiết bên dưới.</p>
                  </div>
                  <div className="p-8 space-y-6">
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên</label>
                        <input
                           type="text"
                           className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                           value={studentForm.name}
                           onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-2">Mã học sinh</label>
                           <input
                              type="text"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                              value={studentForm.studentId}
                              onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày sinh</label>
                           <input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                              value={studentForm.dateOfBirth}
                              onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Lớp</label>
                        <div className="relative">
                           <select
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none text-sm"
                              value={studentForm.className}
                              onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                           >
                              <option value="" disabled>Chọn lớp</option>
                              {classes.map(c => (
                                 <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                           </select>
                           <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                     </div>
                  </div>
                  <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                     <button
                        onClick={() => setIsStudentModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                     >
                        Hủy bỏ
                     </button>
                     <button
                        onClick={handleSaveStudent}
                        className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                     >
                        Lưu học sinh
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* View QR Modal (Updated visual) */}
         {viewQR && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-sm p-0 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="bg-primary p-6 text-center relative">
                     <button
                        onClick={() => setViewQR(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                     >
                        <X size={20} />
                     </button>
                     <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-primary shadow-lg">
                        {viewQR.name.charAt(0)}
                     </div>
                     <h3 className="text-xl font-bold text-white">{viewQR.name}</h3>
                     <p className="text-white/80 text-sm font-medium">{viewQR.studentId}</p>
                  </div>
                  <div className="p-8 flex flex-col items-center">
                     <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 mb-6 shadow-sm">
                        <QRCode
                           id={`qr-modal-${viewQR.id}`}
                           value={viewQR.qrContent}
                           size={200}
                           level="H"
                        />
                     </div>
                     <button
                        onClick={() => {
                           const svg = document.getElementById(`qr-modal-${viewQR.id}`);
                           if (!svg) return;
                           const svgData = new XMLSerializer().serializeToString(svg);
                           const canvas = document.createElement("canvas");
                           const ctx = canvas.getContext("2d");
                           const img = new Image();
                           img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              ctx?.drawImage(img, 0, 0);
                              const pngFile = canvas.toDataURL("image/png");
                              const downloadLink = document.createElement("a");
                              downloadLink.download = `QR-${viewQR.studentId}.png`;
                              downloadLink.href = pngFile;
                              downloadLink.click();
                           };
                           img.src = "data:image/svg+xml;base64," + btoa(svgData);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm"
                     >
                        <Download size={18} />
                        Tải ảnh QR
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* View Attendance History Modal */}
         {viewHistoryStudent && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                  <div className="bg-purple-500 p-6 text-center relative">
                     <button
                        onClick={() => setViewHistoryStudent(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                     >
                        <X size={20} />
                     </button>
                     <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-purple-500 shadow-lg">
                        {viewHistoryStudent.name.charAt(0)}
                     </div>
                     <h3 className="text-xl font-bold text-white">{viewHistoryStudent.name}</h3>
                     <p className="text-white/80 text-sm font-medium">Mã HS: {viewHistoryStudent.studentId}</p>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                     <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <History size={20} className="text-purple-500" />
                        Lịch sử điểm danh
                     </h4>
                     {(!viewHistoryStudent.attendanceHistory || viewHistoryStudent.attendanceHistory.length === 0) ? (
                        <div className="text-center py-10 text-slate-400">
                           <Clock size={48} className="mx-auto mb-3 opacity-50" />
                           <p>Chưa có lịch sử điểm danh</p>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           {viewHistoryStudent.attendanceHistory.slice().reverse().map((record, idx) => (
                              <div key={idx} className={`p-4 rounded-xl border ${record.status === 'on-time' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       {record.status === 'on-time' ? (
                                          <CheckCircle className="text-green-500" size={20} />
                                       ) : (
                                          <AlertTriangle className="text-orange-500" size={20} />
                                       )}
                                       <div>
                                          <p className="font-bold text-slate-900">{record.date}</p>
                                          <p className="text-sm text-slate-500">{record.scheduleName} - {record.time}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${record.status === 'on-time' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                          {record.status === 'on-time' ? 'Đúng giờ' : `Muộn ${record.lateMinutes} phút`}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                     <button
                        onClick={() => setViewHistoryStudent(null)}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm"
                     >
                        Đóng
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default StudentManager;