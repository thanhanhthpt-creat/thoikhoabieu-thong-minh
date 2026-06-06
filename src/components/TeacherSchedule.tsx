import React from "react";
import { Teacher, ScheduleSlot, ClassInfo, Subject } from "../types";
import { User, Calendar, Clock, Award, BarChart2 } from "lucide-react";

interface TeacherScheduleProps {
  selectedTeacher: Teacher | null;
  timetable: { [classId: string]: ScheduleSlot[] };
  subjects: Subject[];
  classes: ClassInfo[];
}

export const TeacherSchedule: React.FC<TeacherScheduleProps> = ({
  selectedTeacher,
  timetable,
  subjects,
  classes
}) => {
  if (!selectedTeacher) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
        <p className="font-semibold text-slate-800 text-sm">Chưa lựa chọn Giáo viên</p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chọn giáo viên từ menu bên trái để kiểm tra thời biểu giảng dạy cá nhân.</p>
      </div>
    );
  }

  // Build schedule matrix for this teacher
  // [day][period] -> { classId, subjectId }
  const scheduleMatrix: { [key: string]: { classId: string; subjectId: string } } = {};
  let totalScheduledPeriods = 0;

  for (const classId in timetable) {
    timetable[classId].forEach(slot => {
      if (slot.teacherId === selectedTeacher.id && slot.subjectId) {
        const key = `${slot.day}-${slot.period}`;
        scheduleMatrix[key] = { classId, subjectId: slot.subjectId };
        
        // Skip assembly and flags placeholder counts
        if (slot.subjectId !== "CC" && slot.subjectId !== "SHL") {
          totalScheduledPeriods++;
        } else {
          // If homeroom advisor, include homeroom meet as part of workload
          if (slot.subjectId === "SHL") {
            totalScheduledPeriods++;
          }
        }
      }
    });
  }

  const getSubjectName = (subjectId: string) => {
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.name : subjectId;
  };

  const getSubjectColorColor = (subjectId: string) => {
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.color : "bg-slate-100 border-slate-200 text-slate-600";
  };

  const daysLabel = ["Monday (T2)", "Tuesday (T3)", "Wednesday (T4)", "Thursday (T5)", "Friday (T6)"];
  const morningPeriods = [1, 2, 3, 4];
  const afternoonPeriods = [5, 6, 7];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      {/* Teacher metadata card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/15">
            {selectedTeacher.shortName[0] || "G"}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{selectedTeacher.name}</h3>
            <p className="text-xs text-slate-500">
              Chuyên môn: <span className="font-semibold text-slate-700">{selectedTeacher.subjectIds.map(sid => subjects.find(s => s.id === sid)?.name || sid).join(", ")}</span>
              {selectedTeacher.isAdvisorOfClassId && (
                <span> | Chủ nhiệm: <strong className="text-blue-600">Lớp {selectedTeacher.isAdvisorOfClassId}</strong></span>
              )}
            </p>
          </div>
        </div>

        {/* Load indicators statistics */}
        <div className="flex items-center gap-4">
          <div className="text-center px-4 py-2 bg-slate-50 border border-slate-150 rounded-xl">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã sắp xếp</span>
            <span className="text-lg font-extrabold text-blue-600">{totalScheduledPeriods} <span className="text-xs font-normal text-slate-500">tiết</span></span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-50 border border-slate-150 rounded-xl">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Định mức</span>
            <span className="text-lg font-extrabold text-slate-700">{selectedTeacher.maxPeriodsPerWeek} <span className="text-xs font-normal text-slate-500">định mức</span></span>
          </div>
          <div className="hidden sm:block">
            <span className="block text-xs font-medium text-slate-400">Tải trọng công việc</span>
            <div className="w-24 bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1.5 border border-slate-200">
              <div
                className={`h-full rounded-full ${totalScheduledPeriods > selectedTeacher.maxPeriodsPerWeek ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
                style={{ width: `${Math.min((totalScheduledPeriods / selectedTeacher.maxPeriodsPerWeek) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="w-24 pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Khung Giờ</th>
              {daysLabel.map((dayLabel, index) => (
                <th key={index} className="pb-3 px-2 text-xs font-semibold text-slate-500 text-center uppercase tracking-wider">
                  {dayLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Morning session Header */}
            <tr className="bg-slate-50/50">
              <td colSpan={6} className="py-2 px-3 text-xs font-bold text-slate-500 tracking-wider">
                🌅 BUỔI SÁNG (Tiết 1 - Tiết 4)
              </td>
            </tr>

            {morningPeriods.map((period) => (
              <tr key={period} className="hover:bg-slate-50/30">
                <td className="py-3 text-xs font-mono text-slate-400 font-medium">
                  {`Tiết ${period}`}
                </td>
                
                {[2, 3, 4, 5, 6].map((day) => {
                  const key = `${day}-${period}`;
                  const lesson = scheduleMatrix[key];
                  const room = lesson ? classes.find(c => c.id === lesson.classId)?.classroomName : null;

                  return (
                    <td key={day} className="p-1.5 text-center">
                      {lesson ? (
                        <div
                          className={`min-h-[64px] rounded-xl border p-2.5 flex flex-col justify-between transition ${getSubjectColorColor(lesson.subjectId)} border-slate-200`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                            {lesson.classId}
                          </div>
                          <div className="text-xs font-bold truncate">
                            {getSubjectName(lesson.subjectId)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            {room || "Phòng học"}
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[64px] rounded-xl border border-dashed border-slate-150 bg-slate-50/30 text-slate-350 flex items-center justify-center text-xs italic">
                          Tự do
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Afternoon session Header */}
            <tr className="bg-slate-50/50">
              <td colSpan={6} className="py-2 px-3 text-xs font-bold text-slate-500 tracking-wider">
                🌇 BUỔI CHIỀU (Tiết 5 - Tiết 7)
              </td>
            </tr>

            {afternoonPeriods.map((period) => (
              <tr key={period} className="hover:bg-slate-50/30">
                <td className="py-3 text-xs font-mono text-slate-400 font-medium">
                  {`Tiết ${period}`}
                </td>
                
                {[2, 3, 4, 5, 6].map((day) => {
                  const key = `${day}-${period}`;
                  const lesson = scheduleMatrix[key];
                  const room = lesson ? classes.find(c => c.id === lesson.classId)?.classroomName : null;

                  const isFridayPMOff = (day === 6);

                  if (isFridayPMOff) {
                    return (
                      <td key={day} className="p-1.5 text-center">
                        <div className="min-h-[64px] rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-400 flex items-center justify-center text-xs font-semibold select-none">
                          Nghỉ cuối tuần
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="p-1.5 text-center">
                      {lesson ? (
                        <div
                          className={`min-h-[64px] rounded-xl border p-2.5 flex flex-col justify-between transition ${getSubjectColorColor(lesson.subjectId)} border-slate-200`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                            {lesson.classId}
                          </div>
                          <div className="text-xs font-bold truncate">
                            {getSubjectName(lesson.subjectId)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            {room || "Phòng học"}
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[64px] rounded-xl border border-dashed border-slate-150 bg-slate-50/30 text-slate-350 flex items-center justify-center text-xs italic">
                          Tự do
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
