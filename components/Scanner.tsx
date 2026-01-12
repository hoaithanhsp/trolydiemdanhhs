import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Schedule, Student, AttendanceStatus, AttendanceRecord } from '../types';
import { Check, AlertTriangle, X, Clock, Users } from 'lucide-react';

interface ScannerProps {
   students: Student[];
   schedules: Schedule[];
   onScan: (record: AttendanceRecord) => void;
   existingRecords: AttendanceRecord[];
}

const Scanner: React.FC<ScannerProps> = ({ students, schedules, onScan, existingRecords }) => {
   const [scanResult, setScanResult] = useState<{
      student: Student;
      status: AttendanceStatus;
      time: string;
      lateMinutes: number;
      message: string;
   } | null>(null);

   const [errorMsg, setErrorMsg] = useState<string | null>(null);
   const scannerRef = useRef<Html5Qrcode | null>(null);
   const isPausedRef = useRef(false);

   // Logic remains same as optimized version
   const getCurrentSchedule = (): Schedule | undefined => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const sortedSchedules = [...schedules].sort((a, b) => {
         const [h1, m1] = a.startTime.split(':').map(Number);
         const [h2, m2] = b.startTime.split(':').map(Number);
         return (h1 * 60 + m1) - (h2 * 60 + m2);
      });
      let activeSchedule = sortedSchedules[0];
      for (let i = sortedSchedules.length - 1; i >= 0; i--) {
         const sch = sortedSchedules[i];
         const [h, m] = sch.startTime.split(':').map(Number);
         const schTime = h * 60 + m;
         if (currentTimeInMinutes >= schTime - 30) {
            activeSchedule = sch;
            break;
         }
      }
      return activeSchedule;
   };

   const handleScanSuccess = (decodedText: string) => {
      if (isPausedRef.current) return;
      try {
         const cleanText = decodedText.trim();
         let student: Student | undefined = undefined;

         console.log("=== QR Scan Debug ===");
         console.log("Scanned text:", cleanText);
         console.log("Total students:", students.length);

         // Thử parse JSON trước
         try {
            const data = JSON.parse(cleanText);
            console.log("Parsed QR data:", data);

            // Tìm theo id hoặc studentId trong JSON
            student = students.find((s) => {
               const match = s.id === data.id ||
                  s.studentId === data.studentId ||
                  s.studentId === data.id ||
                  s.id === data.studentId;
               if (match) console.log("Found by JSON match:", s.name);
               return match;
            });

            // Fallback: Tìm theo name + class nếu có
            if (!student && data.name && data.class) {
               student = students.find(s =>
                  s.name === data.name && s.className === data.class
               );
               if (student) console.log("Found by name+class:", student.name);
            }
         } catch (e) {
            console.log("QR content is not JSON, trying raw match");
         }

         // Fallback 1: Tìm theo studentId hoặc id từ raw text
         if (!student) {
            student = students.find(s =>
               s.studentId === cleanText ||
               s.id === cleanText
            );
            if (student) console.log("Found by raw ID:", student.name);
         }

         // Fallback 2: Tìm theo qrContent khớp chính xác
         if (!student) {
            student = students.find(s => s.qrContent === cleanText);
            if (student) console.log("Found by exact qrContent:", student.name);
         }

         // Fallback 3: So sánh JSON qrContent
         if (!student) {
            student = students.find(s => {
               try {
                  const studentQR = JSON.parse(s.qrContent);
                  const scannedQR = JSON.parse(cleanText);
                  const match = studentQR.id === scannedQR.id ||
                     studentQR.studentId === scannedQR.studentId ||
                     (studentQR.name === scannedQR.name && studentQR.class === scannedQR.class);
                  if (match) console.log("Found by qrContent JSON compare:", s.name);
                  return match;
               } catch {
                  return false;
               }
            });
         }

         // Fallback 4: Tìm theo tên (partial match)
         if (!student) {
            try {
               const data = JSON.parse(cleanText);
               if (data.name) {
                  student = students.find(s =>
                     s.name.toLowerCase().includes(data.name.toLowerCase()) ||
                     data.name.toLowerCase().includes(s.name.toLowerCase())
                  );
                  if (student) console.log("Found by partial name:", student.name);
               }
            } catch { }
         }

         if (!student) {
            console.error("Student not found for QR:", cleanText);
            console.log("Available students:", students.map(s => ({
               id: s.id,
               studentId: s.studentId,
               name: s.name,
               qrContent: s.qrContent
            })));
            showError("Không tìm thấy học sinh trong hệ thống!");
            return;
         }

         const now = new Date();
         const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
         const today = now.toISOString().split('T')[0];
         const schedule = getCurrentSchedule();

         if (!schedule) {
            showError("Không có lịch học nào được cài đặt!");
            return;
         }

         const isDuplicate = existingRecords.some(
            r => r.studentId === student!.id && r.date === today && r.scheduleId === schedule.id
         );

         if (isDuplicate) {
            showError(`Học sinh ${student.name} đã điểm danh rồi!`);
            return;
         }

         const [h, m] = schedule.startTime.split(':').map(Number);
         const scheduleMinutes = h * 60 + m;
         const graceEnd = scheduleMinutes + schedule.graceMinutes;
         const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

         let status: AttendanceStatus = 'on-time';
         let lateMinutes = 0;
         let message = "Đúng giờ";

         if (currentTotalMinutes > graceEnd) {
            status = 'late';
            lateMinutes = currentTotalMinutes - scheduleMinutes;
            message = `Muộn ${lateMinutes} phút`;
         }

         const record: AttendanceRecord = {
            id: `ATD_${Date.now()}`,
            studentId: student.id,
            studentName: student.name,
            studentCode: student.studentId,
            className: student.className,
            date: today,
            time: timeString,
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            status,
            lateMinutes
         };

         onScan(record);
         setScanResult({ student, status, time: timeString, lateMinutes, message });
         const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
         audio.play().catch(() => { });
         pauseScanner(2500);
      } catch (e) {
         console.error("Error scanning QR:", e);
         showError("Mã QR không hợp lệ!");
      }
   };

   const pauseScanner = (ms: number) => {
      isPausedRef.current = true;
      setTimeout(() => {
         isPausedRef.current = false;
         setScanResult(null);
         setErrorMsg(null);
      }, ms);
   }

   const showError = (msg: string) => {
      setErrorMsg(msg);
      pauseScanner(2000);
   }

   useEffect(() => {
      const config = {
         fps: 10,
         qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
               width: Math.floor(minEdge * 0.7),
               height: Math.floor(minEdge * 0.7),
            };
         },
         formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
         experimentalFeatures: { useBarCodeDetectorIfSupported: true }
      };
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;
      scanner.start({ facingMode: "environment" }, config, handleScanSuccess, () => { }).catch(err => {
         console.error("Error starting scanner", err);
         setErrorMsg("Không thể truy cập camera. Vui lòng cấp quyền.");
      });
      return () => {
         if (scanner.isScanning) {
            scanner.stop().then(() => scanner.clear()).catch(console.error);
         } else {
            scanner.clear();
         }
      };
   }, []);

   return (
      <div className="flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] bg-black relative rounded-2xl overflow-hidden shadow-2xl">
         <div className="absolute inset-0 z-0">
            <div id="reader" className="w-full h-full object-cover"></div>
         </div>

         {/* Overlay UI - Reference Style */}
         {!scanResult && !errorMsg && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
               <div className="absolute top-12 md:top-24 w-full text-center">
                  <h1 className="text-white text-2xl font-bold drop-shadow-md">Quét mã QR</h1>
                  <p className="text-white/80 text-sm mt-1">Đưa mã QR của học sinh vào giữa khung hình</p>
               </div>

               {/* Scanning Frame */}
               <div className="relative size-[280px] md:size-[360px] border-2 border-primary/50 rounded-xl qr-frame flex items-center justify-center">
                  <div className="absolute -top-1 -left-1 size-10 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                  <div className="absolute -top-1 -right-1 size-10 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                  <div className="absolute -bottom-1 -left-1 size-10 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                  <div className="absolute -bottom-1 -right-1 size-10 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                  {/* Scanning Line Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70 animate-scan"></div>
               </div>

               {/* Quick Stats Badge */}
               <div className="absolute bottom-10 flex gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 text-white min-w-[140px]">
                     <Users className="text-primary" size={20} />
                     <div>
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Sĩ số</p>
                        <p className="text-lg font-bold">{students.length}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 text-white min-w-[140px]">
                     <Clock className="text-primary" size={20} />
                     <div>
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Đã quét</p>
                        <p className="text-lg font-bold">{existingRecords.filter(r => r.date === new Date().toISOString().split('T')[0]).length}</p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Success Modal - Reference Style */}
         {scanResult && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6">
                     <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                           <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-500 border-4 border-primary">
                              {scanResult.student.name.charAt(0)}
                           </div>
                           <div className="absolute -bottom-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                              <Check size={16} strokeWidth={3} />
                           </div>
                        </div>
                     </div>
                     <div className="text-center space-y-1">
                        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">ĐIỂM DANH THÀNH CÔNG</p>
                        <h3 className="text-2xl font-bold text-slate-900">{scanResult.student.name}</h3>
                        <p className="text-slate-500 font-medium">Mã HS: {scanResult.student.studentId}</p>
                     </div>
                     <div className="mt-6 grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-4">
                        <div className="text-center">
                           <p className="text-xs text-slate-500 uppercase tracking-wider">Thời gian</p>
                           <p className="text-lg font-bold text-slate-900">{scanResult.time}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-xs text-slate-500 uppercase tracking-wider">Trạng thái</p>
                           <div className="mt-1 flex justify-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${scanResult.status === 'on-time' ? 'bg-primary text-white' : 'bg-orange-100 text-orange-700'
                                 }`}>
                                 {scanResult.message}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="mt-6">
                        <button className="w-full py-3 bg-primary hover:bg-green-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                           Tiếp tục quét
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-4 italic">Tự động đóng sau 2s...</p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Error Popup */}
         {errorMsg && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
               <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                     <AlertTriangle size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-800">{errorMsg}</p>
               </div>
            </div>
         )}
      </div>
   );
};

export default Scanner;