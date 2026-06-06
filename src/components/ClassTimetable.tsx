import React, { useState } from "react";
import { ClassInfo, ScheduleSlot, Subject, Teacher, ScheduleConflict } from "../types";
import { ShieldCheck, Info, Calendar, User, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface ClassTimetableProps {
  selectedClass: ClassInfo | null;
  timetable: { [classId: string]: ScheduleSlot[] };
  subjects: Subject[];
  teachers: Teacher[];
  conflicts: ScheduleConflict[];
  onManualSwap: (classId: string, slot1: { day: number; period: number }, slot2: { day: number; period: number }) => void;
}

export const ClassTimetable: React.FC<ClassTimetableProps> = ({
  selectedClass,
  timetable,
  subjects,
  teachers,
  conflicts,
  onManualSwap
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number } | null>(null);

  if (!selectedClass) {
    return (
      <div className="bg-white rounded-2xl border border-slate-205 p-12 text-center text-slate-500">
        <Calendar className="w-12 h-12 text-slate-350 mx-auto mb-3 stroke-1" />
        <p className="font-semibold text-slate-800 text-sm">Chưa lựa chọn Lớp Học</p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng chọn lớp học ở bên trái để theo dõi và tinh chỉnh thời khóa biểu.</p>
      </div>
    );
  }

  const classId = selectedClass.id;
  const slots = timetable[classId] || [];

  // Filter conflicts for this class
  const classConflicts = conflicts.filter(c => c.classId === classId);

  // Helper to find a schedule slot by day and period
  const getSlot = (day: number, period: number) => {
    return slots.find(s => s.day === day && s.period === period);
  };

  const getSubjectColor = (subjectId: string | null) => {
    if (!subjectId) return "bg-slate-50 border-slate-100 hover:bg-slate-100/50 text-slate-400";
    if (subjectId === "NGHI") return "bg-slate-100 hover:bg-slate-150 border-slate-200 text-slate-400 font-medium diagonal-stripes";
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.color : "bg-blue-50 border-blue-100 text-blue-700";
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return "-- Trống --";
    if (subjectId === "NGHI") return "Nghỉ";
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.name : subjectId;
  };

  const getSubjectShort = (subjectId: string | null) => {
    if (!subjectId) return "";
    if (subjectId === "NGHI") return "Nghỉ";
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.shortName : subjectId;
  };

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "";
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.shortName : teacherId;
  };

  const getFunctionalRoomOfSubject = (subjectId: string | null) => {
    if (!subjectId) return null;
    const sub = subjects.find(s => s.id === subjectId);
    return sub?.isFunctionalRoomRequired ? sub.functionalRoomName : null;
  };

  // Helper to identify if a slot has errors
  const getSlotConflict = (day: number, period: number) => {
    return classConflicts.find(c => c.day === day && c.period === period && c.severity === "error");
  };

  const getSlotWarning = (day: number, period: number) => {
    return classConflicts.find(c => c.day === day && c.period === period && c.severity === "warning");
  };

  const handleSlotClick = (day: number, period: number) => {
    const slot = getSlot(day, period);
    if (!slot) return;
    
    // Friday afternoon blocks cannot be interactive / modified as they are school lock
    if (day === 6 && period >= 5) return;

    if (selectedSlot === null) {
      setSelectedSlot({ day, period });
    } else {
      // If clicked the exact same slot, unselect
      if (selectedSlot.day === day && selectedSlot.period === period) {
        setSelectedSlot(null);
      } else {
        // Execute manual swap
        onManualSwap(classId, selectedSlot, { day, period });
        setSelectedSlot(null);
      }
    }
  };

  // Evaluate if a target slot is conflict-free if swapped with our current SELECTED slot
  const checkSwapSafety = (targetDay: number, targetPeriod: number): "perfect" | "conflict" | "neutral" => {
    if (!selectedSlot) return "neutral";
    
    const sourceSlot = getSlot(selectedSlot.day, selectedSlot.period);
    const targetSlot = getSlot(targetDay, targetPeriod);

    if (!sourceSlot || !targetSlot) return "neutral";
    if (targetSlot.isLocked || sourceSlot.isLocked) return "conflict";

    // Simulate swap logic
    const teacherIdSource = sourceSlot.teacherId;
    const teacherIdTarget = targetSlot.teacherId;

    if (!teacherIdSource && !teacherIdTarget) return "perfect";

    // Double bookings check for source teacher in target slot
    if (teacherIdSource) {
      for (const otherClassId in timetable) {
        if (otherClassId === classId) continue;
        const otherSlot = timetable[otherClassId].find(s => s.day === targetDay && s.period === targetPeriod);
        if (otherSlot && otherSlot.teacherId === teacherIdSource && otherSlot.subjectId !== "CC") {
          return "conflict";
        }
      }
    }

    // Double bookings check for target teacher in source slot
    if (teacherIdTarget) {
      for (const otherClassId in timetable) {
        if (otherClassId === classId) continue;
        const otherSlot = timetable[otherClassId].find(s => s.day === selectedSlot.day && s.period === selectedSlot.period);
        if (otherSlot && otherSlot.teacherId === teacherIdTarget && otherSlot.subjectId !== "CC") {
          return "conflict";
        }
      }
    }

    return "perfect";
  };

  const daysLabel = ["Monday (T2)", "Tuesday (T3)", "Wednesday (T4)", "Thursday (T5)", "Friday (T6)"];
  const morningPeriods = [1, 2, 3, 4];
  const afternoonPeriods = [5, 6, 7];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-2xl font-bold text-lg leading-none shadow-md shadow-blue-500/15">
            {selectedClass.name}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Đối chiếu Lớp {selectedClass.name}</h3>
            <p className="text-xs text-slate-500">
              Chủ nhiệm: <span className="font-semibold text-slate-700">{getTeacherName(selectedClass.advisorId)}</span> | Phòng học: {selectedClass.classroomName}
            </p>
          </div>
        </div>

        {/* Tip Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs border border-blue-100">
          <Info className="w-3.5 h-3.5" />
          <span>Click vào 2 ô để <strong>trao đổi tiết học (Swap)</strong>. Ô xanh lá gợi ý vị trí an toàn.</span>
        </div>
      </div>

      {/* Grid view containing Days */}
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
                  {`Tiết ${period}`} <span className="block text-[10px] text-slate-400/80">{period === 1 ? "08h00" : period === 2 ? "08h45" : period === 3 ? "09h45" : "10h30"}</span>
                </td>
                
                {[2, 3, 4, 5, 6].map((day) => {
                  const slot = getSlot(day, period);
                  const isCurSelected = selectedSlot && selectedSlot.day === day && selectedSlot.period === period;
                  const hasErr = getSlotConflict(day, period);
                  const hasWarn = getSlotWarning(day, period);
                  const safetyStatus = selectedSlot ? checkSwapSafety(day, period) : "neutral";

                  let interactionClass = "border-slate-200 hover:border-blue-400 cursor-pointer shadow-current";
                  if (slot?.isLocked && !isCurSelected) {
                    interactionClass = "border-slate-100 bg-slate-50 cursor-not-allowed text-slate-400/80";
                  }

                  // Border styles for Swapping suggestions
                  let swapBorder = "";
                  if (isCurSelected) {
                    swapBorder = "ring-3 ring-blue-500 border-blue-500 scale-102 bg-blue-50/20";
                  } else if (selectedSlot) {
                    if (safetyStatus === "perfect") {
                      swapBorder = "border-emerald-500 hover:bg-emerald-50/35 border-dashed bg-emerald-50/10 scale-101 animate-pulse";
                    } else if (safetyStatus === "conflict") {
                      swapBorder = "border-red-400 bg-red-50/10 cursor-not-allowed opacity-60";
                    }
                  }

                  return (
                    <td
                      key={day}
                      onClick={() => !slot?.isLocked || isCurSelected ? handleSlotClick(day, period) : null}
                      className="p-1.5 transition-all text-center"
                    >
                      <div
                        className={`group min-h-[70px] rounded-xl border p-2 flex flex-col justify-between transition-all ${getSubjectColor(slot?.subjectId)} ${interactionClass} ${swapBorder}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono opacity-40 font-semibold uppercase tracking-wider mb-0.5">
                            {getSubjectShort(slot?.subjectId)}
                          </span>
                          
                          {/* Indicator badges */}
                          {hasErr && (
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block animate-ping" title={hasErr.message} />
                          )}
                          {hasWarn && !hasErr && (
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" title={hasWarn.message} />
                          )}
                          {slot?.isLocked && slot.subjectId !== "CC" && slot.subjectId !== "SHL" && (
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-semibold">Khóa</span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-805 tracking-tight line-clamp-1">
                          {getSubjectName(slot?.subjectId)}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span className="truncate max-w-[70px] text-start">{getTeacherName(slot?.teacherId)}</span>
                          {getFunctionalRoomOfSubject(slot?.subjectId) && (
                            <span className="px-1 text-[8px] bg-indigo-500/10 text-indigo-700 rounded-md border border-indigo-500/15">
                              P.Học
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Afternoon session Header */}
            <tr className="bg-slate-50/50">
              <td colSpan={6} className="py-2 px-3 text-xs font-bold text-slate-505 tracking-wider">
                🌇 BUỔI CHIỀU (Tiết 5 - Tiết 7)
              </td>
            </tr>

            {afternoonPeriods.map((period) => (
              <tr key={period} className="hover:bg-slate-50/30">
                <td className="py-3 text-xs font-mono text-slate-400 font-medium">
                  {`Tiết ${period}`} <span className="block text-[10px] text-slate-400/80">{period === 5 ? "14h00" : period === 6 ? "14h45" : "15h30"}</span>
                </td>
                
                {[2, 3, 4, 5, 6].map((day) => {
                  const slot = getSlot(day, period);
                  const isCurSelected = selectedSlot && selectedSlot.day === day && selectedSlot.period === period;
                  const hasErr = getSlotConflict(day, period);
                  const hasWarn = getSlotWarning(day, period);
                  const safetyStatus = selectedSlot ? checkSwapSafety(day, period) : "neutral";

                  const isFridayPMOff = (day === 6); // Friday PM off

                  let isInteractive = true;
                  let cardBg = getSubjectColor(slot?.subjectId);
                  let displaySubject = getSubjectName(slot?.subjectId);

                  if (isFridayPMOff) {
                    isInteractive = false;
                    cardBg = "bg-neutral-100 border-dashed border-neutral-200 text-neutral-400/60";
                    displaySubject = "Nghỉ (Off)";
                  }

                  let interactionClass = "border-slate-200 hover:border-blue-400 cursor-pointer shadow-current";
                  if (!isInteractive) {
                    interactionClass = "cursor-not-allowed select-none bg-slate-100 opacity-75 border-slate-200";
                  }

                  // Border styles for swapping
                  let swapBorder = "";
                  if (isInteractive && isCurSelected) {
                    swapBorder = "ring-3 ring-blue-500 border-blue-500 scale-102 bg-blue-50/20";
                  } else if (isInteractive && selectedSlot) {
                    if (safetyStatus === "perfect") {
                      swapBorder = "border-emerald-500 hover:bg-emerald-50/35 border-dashed bg-emerald-50/10 scale-101 animate-pulse";
                    } else if (safetyStatus === "conflict") {
                      swapBorder = "border-red-400 bg-red-50/10 cursor-not-allowed opacity-60";
                    }
                  }

                  return (
                    <td
                      key={day}
                      onClick={() => isInteractive ? handleSlotClick(day, period) : null}
                      className="p-1.5 transition-all text-center"
                    >
                      <div
                        className={`group min-h-[70px] rounded-xl border p-2 flex flex-col justify-between transition-all ${cardBg} ${interactionClass} ${swapBorder}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono opacity-40 font-semibold uppercase tracking-wider mb-0.5">
                            {!isFridayPMOff ? getSubjectShort(slot?.subjectId) : ""}
                          </span>
                          {hasErr && !isFridayPMOff && (
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block animate-ping" title={hasErr.message} />
                          )}
                          {hasWarn && !hasErr && !isFridayPMOff && (
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" title={hasWarn.message} />
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-800 tracking-tight line-clamp-1">
                          {displaySubject}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium font-mono">
                          {!isFridayPMOff ? (
                            <>
                              <span className="truncate max-w-[70px] text-start">{getTeacherName(slot?.teacherId)}</span>
                              {getFunctionalRoomOfSubject(slot?.subjectId) && (
                                <span className="px-1 text-[8px] bg-indigo-500/10 text-indigo-700 rounded-md border border-indigo-500/15">
                                  Sânbãi
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-450 italic">Cuối Tuần</span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conflicts alerting panel */}
      {classConflicts.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-semibold text-slate-800">Cảnh báo & Phát hiện xung đột ({classConflicts.length})</h4>
          </div>
          <div className="space-y-2 max-h-[160px] overflow-y-auto">
            {classConflicts.map((c, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
                  c.severity === "error"
                    ? "bg-red-50 border-red-100 text-red-700"
                    : "bg-amber-50 border-amber-100 text-amber-700"
                }`}
              >
                <div className="mt-0.5 font-bold">
                  {c.severity === "error" ? "❌ LỖI:" : "⚠️ CẢNH BÁO:"}
                </div>
                <div className="flex-1">{c.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict free sign */}
      {classConflicts.length === 0 && (
        <div className="mt-6 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Thời khóa biểu Lớp <strong>{selectedClass.name}</strong> hoàn toàn tối ưu. Không phát hiện bất kỳ xung đột lịch dạy hay hao hụt tiết học nào!</span>
        </div>
      )}
    </div>
  );
};
