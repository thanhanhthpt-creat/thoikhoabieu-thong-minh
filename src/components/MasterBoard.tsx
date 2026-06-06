import React from "react";
import { ScheduleSlot, ClassInfo, Subject, Teacher } from "../types";
import { Grid, FileSpreadsheet, Download, RefreshCw, CalendarRange } from "lucide-react";
import * as XLSX from "xlsx";

interface MasterBoardProps {
  classes: ClassInfo[];
  timetable: { [classId: string]: ScheduleSlot[] };
  subjects: Subject[];
  teachers: Teacher[];
}

export const MasterBoard: React.FC<MasterBoardProps> = ({
  classes,
  timetable,
  subjects,
  teachers
}) => {
  const daysList = [2, 3, 4, 5, 6]; // Monday to Friday
  const periodsList = [1, 2, 3, 4, 5, 6, 7];

  const getSubjectShort = (classId: string, day: number, period: number) => {
    const slots = timetable[classId] || [];
    const slot = slots.find(s => s.day === day && s.period === period);
    if (!slot) return "";
    if (day === 6 && period >= 5) return "Nghỉ";
    
    const sub = subjects.find(s => s.id === slot.subjectId);
    const teacher = teachers.find(t => t.id === slot.teacherId);
    
    if (sub && teacher) {
      return `${sub.shortName} (${teacher.shortName})`;
    } else if (sub) {
      return sub.shortName;
    }
    return "";
  };

  const getSlotDetails = (classId: string, day: number, period: number) => {
    const slots = timetable[classId] || [];
    const slot = slots.find(s => s.day === day && s.period === period);
    if (!slot) return null;
    const sub = subjects.find(s => s.id === slot.subjectId);
    const teacher = teachers.find(t => t.id === slot.teacherId);
    return { slot, sub, teacher };
  };

  const dayNames: { [day: number]: string } = {
    2: "Thứ Hai (Monday)",
    3: "Thứ Ba (Tuesday)",
    4: "Thứ Tư (Wednesday)",
    5: "Thứ Năm (Thursday)",
    6: "Thứ Sáu (Friday)"
  };

  // Export school-wide scheduler into a single Excel file (Trang tổng hợp toàn trường)
  const handleExportExcelMaster = () => {
    // We create a sheet. Columns are: Day, Period, Class1, Class2, ... Class15
    const headers = ["Thứ", "Tiết", ...classes.map(c => `Lớp ${c.name}`)];
    const rows: any[] = [];

    daysList.forEach(day => {
      periodsList.forEach(period => {
        // Special condition: Friday afternoon is off
        if (day === 6 && period >= 5) {
          const rowData = [
            dayNames[day],
            `Tiết ${period}`,
            ...classes.map(() => "NGHỈ CUỐI TUẦN")
          ];
          rows.push(rowData);
          return;
        }

        const rowData = [
          dayNames[day],
          `Tiết ${period}`,
          ...classes.map(c => {
            const slots = timetable[c.id] || [];
            const slot = slots.find(s => s.day === day && s.period === period);
            if (!slot || !slot.subjectId) return "--";
            
            const sub = subjects.find(s => s.id === slot.subjectId);
            const teacher = teachers.find(t => t.id === slot.teacherId);
            return `${sub ? sub.name : slot.subjectId} (${teacher ? teacher.shortName : ""})`;
          })
        ];
        rows.push(rowData);
      });
    });

    // Generate sheet content
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["BẢNG THỜI KHÓA BIỂU TOÀN TRƯỜNG TIỂU HỌC"],
      ["Khung chuẩn: 7 tiết/ngày - Nghỉ chiều thứ Sáu"],
      [],
      headers,
      ...rows
    ]);

    // Apply auto width sizing safely
    const colWidths = headers.map(() => ({ wch: 18 }));
    colWidths[0] = { wch: 22 }; // Day width
    colWidths[1] = { wch: 10 }; // Period width
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TKB Toàn Trường");

    // Output spreadsheet file
    XLSX.writeFile(workbook, "thoi_khoa_bieu_toan_truong.xlsx");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Thời khóa biểu Toàn trường</h3>
            <p className="text-xs text-slate-500">Mạng lưới 15 lớp học và 7 tiết biểu diễn theo ngày giúp phân bổ nguồn lực toàn diện</p>
          </div>
        </div>

        {/* Action Button for Spreadsheet Download */}
        <button
          onClick={handleExportExcelMaster}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/10 transition duration-150"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Tải file Excel Toàn Trường (1 Trang)</span>
        </button>
      </div>

      {/* Grid container with scrolling for huge datasets */}
      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
        <table className="w-full text-[11px] border-collapse min-w-[1250px]">
          <thead>
            <tr className="bg-slate-55 bg-slate-50 border-b border-slate-200 divide-x divide-slate-150">
              <th className="p-3 w-36 font-semibold text-slate-500 text-center">Thứ / Tiết</th>
              {classes.map(c => (
                <th key={c.id} className="p-3 font-bold text-slate-700 text-center uppercase tracking-wider bg-indigo-500/5">
                  Lớp {c.name}
                  <span className="block text-[8px] font-normal text-slate-400 mt-0.5">Phòng {c.classroomName.split(" ").pop()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {daysList.map(day => (
              <React.Fragment key={day}>
                {/* Visual grouping of days with custom divider tag */}
                <tr className="bg-slate-100/35 border-y border-slate-200">
                  <td colSpan={classes.length + 1} className="py-2 px-3 font-semibold text-slate-600 bg-slate-100/50">
                    📅 {dayNames[day].toUpperCase()}
                  </td>
                </tr>

                {periodsList.map(period => {
                  const isFridayPMOff = (day === 6 && period >= 5);

                  return (
                    <tr key={period} className="hover:bg-slate-50/50 divide-x divide-slate-150">
                      <td className="p-2.5 font-mono text-slate-450 font-medium text-center bg-slate-50/30">
                        Tiết {period}
                        <span className="block text-[9px] text-slate-400 font-normal">
                          {period <= 4 ? "Sáng" : "Chiều"}
                        </span>
                      </td>

                      {classes.map(c => {
                        const details = getSlotDetails(c.id, day, period);

                        if (isFridayPMOff) {
                          return (
                            <td key={c.id} className="p-2 text-center bg-neutral-100 text-neutral-400 font-mono text-[9px]">
                              Nghỉ
                            </td>
                          );
                        }

                        if (!details || !details.slot.subjectId) {
                          return (
                            <td key={c.id} className="p-2 text-center text-slate-300 italic">
                              --
                            </td>
                          );
                        }

                        const { slot, sub, teacher } = details;
                        return (
                          <td
                            key={c.id}
                            className={`p-2.5 transition text-center hover:bg-white/80`}
                          >
                            <div className="font-bold text-slate-800 line-clamp-1">
                              {sub ? sub.shortName : slot.subjectId}
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                              {teacher ? teacher.shortName : ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
