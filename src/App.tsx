import { useState, useEffect, ChangeEvent } from "react";
import {
  CalendarRange,
  Users,
  Grid,
  FileSpreadsheet,
  Settings,
  Sparkles,
  BarChart3,
  Bot,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  CalendarDays,
  Info,
  SlidersHorizontal,
  FolderSync,
  AlertTriangle,
  Play,
  HeartOff,
  UserCheck,
  Printer
} from "lucide-react";

import { Subject, ClassInfo, Teacher, Timetable, ScheduleSlot, ScheduleConflict } from "./types";
import { DEFAULT_SUBJECTS, DEFAULT_CLASSES, DEFAULT_TEACHERS } from "./mockData";
import { createEmptyTimetable, auditTimetable, generateSchedule, copyTimetable } from "./utils/scheduler";

// Components
import { KeyConfiguration } from "./components/KeyConfiguration";
import { ClassTimetable } from "./components/ClassTimetable";
import { TeacherSchedule } from "./components/TeacherSchedule";
import { MasterBoard } from "./components/MasterBoard";
import { TeacherReport } from "./components/TeacherReport";
import { SetupData } from "./components/SetupData";
import { AiAdvisor } from "./components/AiAdvisor";

import * as XLSX from "xlsx";

export default function App() {
  // --- DATABASE STATES ---
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem("sched_subjects");
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [classes, setClasses] = useState<ClassInfo[]>(() => {
    const saved = localStorage.getItem("sched_classes");
    return saved ? JSON.parse(saved) : DEFAULT_CLASSES;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem("sched_teachers");
    return saved ? JSON.parse(saved) : DEFAULT_TEACHERS;
  });

  const [timetable, setTimetable] = useState<Timetable>(() => {
    const saved = localStorage.getItem("sched_timetable");
    return saved ? JSON.parse(saved) : createEmptyTimetable(DEFAULT_CLASSES);
  });

  // --- API / AI CONFIG STATES ---
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("gemini_api_key") || "";
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("sched_selected_model") || "gemini-3-pro-preview";
  });

  // --- INTERFACE CONTROL STATES ---
  const [activeTab, setActiveTab] = useState<"class_tkb" | "master_tkb" | "teacher_tkb" | "teacher_reports" | "setup" | "ai_ask">("class_tkb");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [isToast, setIsToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Auto-show modal if no API key
  useEffect(() => {
    if (!apiKey) {
      setShowSettingsModal(true);
    }
  }, [apiKey]);

  // --- AUTO SAVING TRIGGERS ---
  useEffect(() => {
    localStorage.setItem("sched_subjects", JSON.stringify(subjects));
    localStorage.setItem("sched_classes", JSON.stringify(classes));
    localStorage.setItem("sched_teachers", JSON.stringify(teachers));
  }, [subjects, classes, teachers]);

  useEffect(() => {
    localStorage.setItem("sched_timetable", JSON.stringify(timetable));
    // Re-evaluate conflicts
    const errors = auditTimetable(timetable, classes, teachers, subjects);
    setConflicts(errors);
  }, [timetable, classes, teachers, subjects]);

  useEffect(() => {
    localStorage.setItem("sched_selected_model", selectedModel);
  }, [selectedModel]);

  // --- AUTOMATIC MIGRATION FOR OLD DATA ---
  useEffect(() => {
    const hasNewSubjects = subjects.some(s => s.id === "LTOAN");
    if (!hasNewSubjects) {
      setSubjects(DEFAULT_SUBJECTS);
      setClasses(DEFAULT_CLASSES);
      setTeachers(DEFAULT_TEACHERS);
      setTimetable(createEmptyTimetable(DEFAULT_CLASSES));
      setIsToast({ message: "Hệ thống đã tự động cập nhật cấu hình môn học mới nhất.", type: "info" });
      setTimeout(() => setIsToast(null), 4000);
    }
  }, []);

  // Establish default selections on mount
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [classes, teachers]);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setIsToast({ message, type });
    setTimeout(() => {
      setIsToast(null);
    }, 4000);
  };

  // --- TIMETABLE GENERATION ---
  const handleAutoSchedule = () => {
    try {
      const generated = generateSchedule(classes, teachers, subjects);
      setTimetable(generated);
      triggerToast("Tự động xếp lịch thành công! Hệ thống đã phân rải tiết học rải chuyên sâu.", "success");
    } catch (e: any) {
      console.error(e);
      triggerToast("Đã xảy ra sự cố trong quá trình xếp lịch tự động.", "error");
    }
  };

  const handleClearTimetable = () => {
    if (confirm("Bạn có chắc chắn muốn xóa rỗng tất cả dữ liệu thời khóa biểu đang chạy để xếp lại từ đầu?")) {
      const empty = createEmptyTimetable(classes);
      setTimetable(empty);
      triggerToast("Đã đặt lại thời khóa biểu sạch toàn trường.", "info");
    }
  };

  // --- SWAPPING & MANUAL ADJUSTMENT ---
  const handleManualSwap = (classId: string, slot1: { day: number; period: number }, slot2: { day: number; period: number }) => {
    const classSlots = timetable[classId] || [];
    const idx1 = classSlots.findIndex(s => s.day === slot1.day && s.period === slot1.period);
    const idx2 = classSlots.findIndex(s => s.day === slot2.day && s.period === slot2.period);

    if (idx1 === -1 || idx2 === -1) return;

    // Validate locks (cannot move system locks)
    if (classSlots[idx1].isLocked || classSlots[idx2].isLocked) {
      triggerToast("Khung thời gian có tiết Khóa hệ thống (Chào cờ, Sinh hoạt...) không thể dịch chuyển.", "error");
      return;
    }

    const nextTimetable = copyTimetable(timetable);
    const targetSlots = nextTimetable[classId];

    // Swap subjects and teachers
    const tempSub = targetSlots[idx1].subjectId;
    const tempTeach = targetSlots[idx1].teacherId;

    targetSlots[idx1].subjectId = targetSlots[idx2].subjectId;
    targetSlots[idx1].teacherId = targetSlots[idx2].teacherId;

    targetSlots[idx2].subjectId = tempSub;
    targetSlots[idx2].teacherId = tempTeach;

    setTimetable(nextTimetable);
    triggerToast("Điểu chỉnh thủ công thành công. Hãy quan sát cảnh báo xung đột bên dưới.", "success");
  };

  // --- INDIVIDUAL DOWNLOAD EXPORTERS ---
  const handleExportClassExcel = (classId: string) => {
    const slots = timetable[classId] || [];
    const daysLabel = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"];
    const morningPeriods = [1, 2, 3, 4];
    const afternoonPeriods = [5, 6, 7];

    const rows: any[] = [];

    // Process Morning
    rows.push(["SÁNG"]);
    morningPeriods.forEach(p => {
      const row = [
        `Tiết ${p}`,
        ...[2,3,4,5,6].map(d => {
          const slot = slots.find(s => s.day === d && s.period === p);
          if (!slot || !slot.subjectId) return "--";
          const sub = subjects.find(s => s.id === slot.subjectId);
          const teach = teachers.find(t => t.id === slot.teacherId);
          return `${sub ? sub.name : slot.subjectId} (${teach ? teach.shortName : ""})`;
        })
      ];
      rows.push(row);
    });

    // Process Afternoon
    rows.push([]);
    rows.push(["CHIỀU"]);
    afternoonPeriods.forEach(p => {
      const row = [
        `Tiết ${p}`,
        ...[2,3,4,5,6].map(d => {
          if (d === 6) return "NGHỈ CUỐI TUẦN";
          const slot = slots.find(s => s.day === d && s.period === p);
          if (!slot || !slot.subjectId) return "--";
          const sub = subjects.find(s => s.id === slot.subjectId);
          const teach = teachers.find(t => t.id === slot.teacherId);
          return `${sub ? sub.name : slot.subjectId} (${teach ? teach.shortName : ""})`;
        })
      ];
      rows.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet([
      [`THỜI KHÓA BIỂU PHÂN LỚP: ${classId}`],
      [`Phòng học: ${classes.find(c => c.id === classId)?.classroomName || ""} | Năm học chuẩn`],
      [],
      ["Tiết học", ...daysLabel],
      ...rows
    ]);

    // Set columns width
    worksheet["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Lớp ${classId}`);
    XLSX.writeFile(workbook, `TKB_Lop_${classId}.xlsx`);
    triggerToast(`Đã xuất và tải tập tin Excel TKB Lớp ${classId}.`, "success");
  };

  // --- EXPORT/IMPORT BACKUPS ---
  const handleExportBackup = () => {
    const payload = {
      subjects,
      classes,
      teachers,
      timetable
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_tkb_tieuhoc_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    triggerToast("Xuất tập tin sao lưu cấu hình trường thành công!", "success");
  };

  const handleImportBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.subjects && data.classes && data.teachers && data.timetable) {
          setSubjects(data.subjects);
          setClasses(data.classes);
          setTeachers(data.teachers);
          setTimetable(data.timetable);
          triggerToast("Nạp tệp sao lưu trường học thành công! Toàn bộ bảng đã được đồng bộ.", "success");
        } else {
          triggerToast("Tập tin sao lưu không đúng định dạng chuẩn.", "error");
        }
      } catch (err) {
        triggerToast("Lỗi khi đọc tập tin cấu hình sao lưu.", "error");
      }
    };
    reader.readAsText(file);
  };

  // Reset all database directories to factory defaults
  const handleResetToSystemDefaults = () => {
    if (confirm("Khôi phục mặc định sẽ ghi đè toàn bộ Lớp, Giáo viên, Định mức môn học hiện có về gốc. Quý khách có đồng ý?")) {
      setSubjects(DEFAULT_SUBJECTS);
      setClasses(DEFAULT_CLASSES);
      setTeachers(DEFAULT_TEACHERS);
      setTimetable(createEmptyTimetable(DEFAULT_CLASSES));
      triggerToast("Đã khôi phục toàn bộ danh mục trường về định hình mẫu.", "info");
    }
  };

  // Print Friendly print routing helper
  const handlePrintFriendly = () => {
    window.print();
  };

  const activeClass = classes.find(c => c.id === selectedClassId) || null;
  const activeTeacher = teachers.find(t => t.id === selectedTeacherId) || null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col antialiased">
      {/* Toast Alert panel */}
      {isToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in no-print">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
            isToast.type === "success"
              ? "bg-emerald-50 border-emerald-150 text-emerald-800"
              : isToast.type === "error"
              ? "bg-red-50 border-red-150 text-red-800"
              : "bg-blue-50 border-blue-150 text-blue-800"
          }`}>
            <Info className={`w-5 h-5 ${isToast.type === "success" ? "text-emerald-600" : isToast.type === "error" ? "text-red-500" : "text-blue-500"}`} />
            <span className="text-xs font-semibold">{isToast.message}</span>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm shadow-slate-100/40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-amber-500 rounded-xl text-white shadow-md shadow-blue-500/10">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg flex items-center gap-2">
                Trợ lý Xếp Thời Khóa Biểu Tiểu Học
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-500/15">
                  AI-Powered
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Hệ thống tối ưu hóa định lượng 15 Lớp • 20 Giáo viên • 17 Môn học</p>
            </div>
          </div>

          {/* Quick Engine Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Run Auto Schedule button */}
            <button
              onClick={handleAutoSchedule}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/15 transition transform active:scale-97 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự Động Xếp Lịch</span>
            </button>

            {/* Clear schedules button */}
            <button
              onClick={handleClearTimetable}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-105 hover:bg-slate-150 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              title="Đặt rỗng tất cả các tiết học"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset TKB</span>
            </button>

            {/* Print action */}
            <button
              onClick={handlePrintFriendly}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-105 hover:bg-slate-150 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              title="In trực tiếp hoặc gửi lưu file PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In TKB</span>
            </button>

            {/* Settings & API Key Action */}
            <div className="flex flex-col items-end gap-1 ml-4 border-l border-slate-200 pl-4">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-md"
                title="Cấu hình hệ thống & API Key"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings (API Key)</span>
              </button>
              {!apiKey && (
                <a 
                  href="https://aistudio.google.com/api-keys" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-red-500 font-bold hover:underline"
                >
                  Lấy API key để sử dụng app
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER LAYOUT */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT NAV PANEL - CATÉGORIES & SELECTORS */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6 no-print">
          {/* Main Visual Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Bảng điều hướng</span>
            
            <button
              onClick={() => setActiveTab("class_tkb")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
                activeTab === "class_tkb" ? "bg-blue-50 text-blue-600 border border-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <span>Thời khóa biểu Lớp</span>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono font-bold text-slate-500">15 Lớp</span>
            </button>

            <button
              onClick={() => setActiveTab("master_tkb")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
                activeTab === "master_tkb" ? "bg-blue-50 text-blue-600 border border-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-slate-500" />
                <span>Bảng Tổng Hợp Trường</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("teacher_tkb")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
                activeTab === "teacher_tkb" ? "bg-blue-50 text-blue-600 border border-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Thời khóa biểu Giáo viên</span>
              </div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono font-bold text-slate-500">20 GV</span>
            </button>

            <button
              onClick={() => setActiveTab("teacher_reports")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
                activeTab === "teacher_reports" ? "bg-blue-50 text-blue-600 border border-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <span>Báo Cáo Tải Trọng</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("ai_ask")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
                activeTab === "ai_ask" ? "bg-indigo-50/50 text-indigo-700 border border-indigo-100/40" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-indigo-500 font-bold" />
                <span className="font-bold">Trợ Lý Phân Tích AI</span>
              </div>
              <span className="h-2 w-2 bg-amber-400 rounded-full animate-ping" />
            </button>

            <button
              onClick={() => setActiveTab("setup")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition ${
                activeTab === "setup" ? "bg-blue-50 text-blue-600 border border-blue-100/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Thiết Lập Danh Mục</span>
              </div>
            </button>
          </div>

          {/* ACTIVE SELECTORS ON PANEL */}
          {activeTab === "class_tkb" && classes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-205 p-4 shadow-sm space-y-3.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Lựa chọn khối lớp</span>
              <div className="grid grid-cols-3 gap-2">
                {classes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition ${
                      selectedClassId === c.id
                        ? "bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-500/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-705 border-slate-200"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3.5 flex flex-col gap-2">
                <button
                  onClick={() => handleExportClassExcel(selectedClassId)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mở rộng Excel Lớp này</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "teacher_tkb" && teachers.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-205 p-4 shadow-sm space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Danh sách Giáo viên</span>
              <div className="max-h-[340px] overflow-y-auto space-y-1">
                {teachers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left border transition ${
                      selectedTeacherId === t.id
                        ? "bg-gradient-to-r from-amber-50 to-orange-50/20 text-orange-700 border-orange-200"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-100/50"
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="font-mono text-[9px] opacity-60">({t.shortName})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUICK API GUIDE / SYSTEM INFOS */}
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Danh mục Thao tác nhanh</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Bạn có thể khôi phục lại dữ liệu danh mục ban đầu (20 giáo viên, 15 lớp, định mức chuẩn) nhanh chóng nếu lỡ tay làm rỗng dữ liệu.
            </p>
            <button
              onClick={handleResetToSystemDefaults}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
              <span>Khôi phục dữ liệu mẫu gốc</span>
            </button>
          </div>
        </aside>

        {/* MAIN VISUAL LAYOUT & TAB CONTENTS */}
        <main className="flex-1 min-w-0">
          
          {/* Active Tab View routers */}
          {activeTab === "class_tkb" && (
            <div className="space-y-6">
              <ClassTimetable
                selectedClass={activeClass}
                timetable={timetable}
                subjects={subjects}
                teachers={teachers}
                conflicts={conflicts}
                onManualSwap={handleManualSwap}
              />
            </div>
          )}

          {activeTab === "master_tkb" && (
            <div className="space-y-6 animate-fade-in">
              <MasterBoard
                classes={classes}
                timetable={timetable}
                subjects={subjects}
                teachers={teachers}
              />
            </div>
          )}

          {activeTab === "teacher_tkb" && (
            <div className="space-y-6 animate-fade-in">
              <TeacherSchedule
                selectedTeacher={activeTeacher}
                timetable={timetable}
                subjects={subjects}
                classes={classes}
              />
            </div>
          )}

          {activeTab === "teacher_reports" && (
            <div className="space-y-6 animate-fade-in">
              <TeacherReport
                teachers={teachers}
                timetable={timetable}
                subjects={subjects}
                classes={classes}
              />
            </div>
          )}

          {activeTab === "setup" && (
            <div className="space-y-6 animate-fade-in">
              <SetupData
                classes={classes}
                teachers={teachers}
                subjects={subjects}
                onUpdateClasses={setClasses}
                onUpdateTeachers={setTeachers}
                onUpdateSubjects={setSubjects}
              />
            </div>
          )}

          {activeTab === "ai_ask" && (
            <div className="space-y-6 animate-fade-in">
              <AiAdvisor
                apiKey={apiKey}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                classes={classes}
                teachers={teachers}
                subjects={subjects}
                timetable={timetable}
              />
            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Hệ thống Tự động và Kiểm toán Thời khóa biểu Tiêu Chuẩn Tiểu Học.</p>
          <p className="mt-1">Cấp hành chính: Ban Giám hiệu & Ban Quản lý Chuyên môn Trường Tiểu Học.</p>
        </div>
      </footer>

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 right-0 p-4 flex justify-end z-10">
              <button 
                onClick={() => {
                  if (apiKey) {
                    setShowSettingsModal(false);
                  } else {
                    triggerToast("Vui lòng nhập API Key để tiếp tục sử dụng ứng dụng.", "error");
                  }
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition"
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6 pt-2">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Thiết lập Model & API Key</h2>
              {!apiKey && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium">Bạn cần cung cấp Gemini API Key để ứng dụng có thể hoạt động.</p>
                  <p className="text-xs text-amber-700 mt-1">Hướng dẫn: Truy cập <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Google AI Studio</a> để lấy key.</p>
                </div>
              )}
              <KeyConfiguration
                apiKey={apiKey}
                setApiKey={setApiKey}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
