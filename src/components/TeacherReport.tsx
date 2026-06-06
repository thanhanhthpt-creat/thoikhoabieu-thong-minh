import React from "react";
import { Teacher, ScheduleSlot, ClassInfo, Subject } from "../types";
import { BarChart3, TrendingUp, AlertOctagon, Download, Printer, Users } from "lucide-react";
import * as XLSX from "xlsx";

interface TeacherReportProps {
  teachers: Teacher[];
  timetable: { [classId: string]: ScheduleSlot[] };
  subjects: Subject[];
  classes: ClassInfo[];
}

export const TeacherReport: React.FC<TeacherReportProps> = ({
  teachers,
  timetable,
  subjects,
  classes
}) => {
  // Calculate periods for each teacher
  const getTeacherPeriods = (teacherId: string) => {
    let count = 0;
    const assignments: { classId: string; subjectId: string; day: number; period: number }[] = [];

    for (const classId in timetable) {
      timetable[classId].forEach(slot => {
        if (slot.teacherId === teacherId && slot.subjectId) {
          assignments.push({
            classId,
            subjectId: slot.subjectId,
            day: slot.day,
            period: slot.period
          });
          
          if (slot.subjectId !== "CC" && slot.subjectId !== "SHL") {
            count++;
          } else if (slot.subjectId === "SHL") {
            count++; // Homeroom meets count as 1 workload period
          }
        }
      });
    }

    return { count, assignments };
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || subjectId;
  };

  const getDayName = (dayNum: number) => {
    const days: { [key: number]: string } = { 2: "Thứ Hai", 3: "Thứ Ba", 4: "Thứ Tư", 5: "Thứ Năm", 6: "Thứ Sáu" };
    return days[dayNum] || `Thứ ${dayNum}`;
  };

  // Export individual teacher schedule file
  const handleExportTeacherExcel = (teacher: Teacher) => {
    const { assignments } = getTeacherPeriods(teacher.id);

    // Sort assignments chronological order
    assignments.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.period - b.period;
    });

    const rows = assignments.map(a => [
      getDayName(a.day),
      `Tiết ${a.period}`,
      `Lớp ${a.classId}`,
      getSubjectName(a.subjectId),
      classes.find(c => c.id === a.classId)?.classroomName || ""
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([
      [`LỊCH GIẢNG DẠY CÁ NHÂN - GIÁO VIÊN: ${teacher.name.toUpperCase()}`],
      [`Định mức quy định: ${teacher.maxPeriodsPerWeek} tiết/tuần | Thực xếp: ${rows.length} tiết`],
      [],
      ["Ngày dạy", "Tiết học", "Lớp dạy", "Môn học giảng dạy", "Phòng học"],
      ...rows
    ]);

    // Format cols width
    worksheet["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `TKB ${teacher.shortName}`);

    XLSX.writeFile(workbook, `TKB_GV_${teacher.shortName.replace(/[\s\.]+/g, "_")}.xlsx`);
  };

  // Compile general school summaries
  const compiledData = teachers.map(t => {
    const { count, assignments } = getTeacherPeriods(t.id);
    const ratio = count / t.maxPeriodsPerWeek;
    return {
      teacher: t,
      periodsCount: count,
      assignments,
      ratio,
      isOverloaded: count > t.maxPeriodsPerWeek
    };
  });

  const totalSchoolWeeklyPeriods = compiledData.reduce((acc, curr) => acc + curr.periodsCount, 0);
  const averagePeriodsPerTeacher = Math.round((totalSchoolWeeklyPeriods / teachers.length) * 10) / 10;
  const overloadedCount = compiledData.filter(d => d.isOverloaded).length;

  return (
    <div className="space-y-6">
      {/* High-level performance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Tổng số tiết tuần</span>
            <span className="text-2xl font-extrabold text-slate-800">{totalSchoolWeeklyPeriods} <span className="text-sm font-normal text-slate-500">tiết</span></span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Tải trung bình/GV</span>
            <span className="text-2xl font-extrabold text-emerald-600">{averagePeriodsPerTeacher} <span className="text-sm font-normal text-slate-500">tiết</span></span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/85 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Giáo viên quá tải</span>
            <span className={`text-2xl font-extrabold ${overloadedCount > 0 ? "text-amber-500" : "text-slate-700"}`}>
              {overloadedCount} <span className="text-sm font-normal text-slate-500">nhân sự</span>
            </span>
          </div>
          <div className={`p-3 rounded-xl ${overloadedCount > 0 ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-400"}`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Báo cáo kiểm toán tải trọng giáo viên</h3>
            <p className="text-xs text-slate-500">Bảng theo dõi định mức tiết dạy của 20 giáo viên bổ môn và chủ nhiệm hàng tuần</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-550 text-xs font-semibold tracking-wider">
                <th className="pb-3 w-1/4">Giáo viên</th>
                <th className="pb-3 text-center">Định mức</th>
                <th className="pb-3 text-center">Thực xếp (Tiết)</th>
                <th className="pb-3 w-1/3">Tỷ lệ tải trọng</th>
                <th className="pb-3 text-center">Trạng thái</th>
                <th className="pb-3 text-right">Xuất Excel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compiledData.map(({ teacher, periodsCount, ratio, isOverloaded }) => (
                <tr key={teacher.id} className="hover:bg-slate-50/40 py-3 block-row align-middle text-sm text-slate-700">
                  <td className="py-3.5 pr-2">
                    <div className="font-bold text-slate-800">{teacher.name}</div>
                    <span className="text-xs text-slate-450 uppercase tracking-widest font-mono font-medium block mt-0.5">
                      {teacher.shortName}
                    </span>
                  </td>

                  <td className="py-3.5 text-center font-mono font-semibold text-slate-600">
                    {teacher.maxPeriodsPerWeek}
                  </td>

                  <td className="py-3.5 text-center font-mono font-bold text-slate-800">
                    {periodsCount}
                  </td>

                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-150">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverloaded
                              ? "bg-red-500"
                              : ratio > 0.85
                              ? "bg-amber-400"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold w-10 text-right">
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 text-center">
                    {isOverloaded ? (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold border border-red-500/20 uppercase tracking-wider">
                        Quá Tải
                      </span>
                    ) : ratio > 0.85 ? (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-500/20 uppercase tracking-wider">
                        Đầy tải
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-55/20 uppercase tracking-wider">
                        An Toàn
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 text-right pr-2">
                    <button
                      onClick={() => handleExportTeacherExcel(teacher)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 hover:border-slate-350 text-[11px] rounded-lg font-medium transition"
                      title="Xuất file XLSX cho giáo viên này"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>Tải file</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
