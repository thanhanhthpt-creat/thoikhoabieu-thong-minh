import { Subject, ClassInfo, Teacher, Timetable, ScheduleSlot, ScheduleConflict } from "../types";

// Deep copy helper
export function copyTimetable(timetable: Timetable): Timetable {
  const result: Timetable = {};
  for (const classId in timetable) {
    result[classId] = timetable[classId].map(slot => ({ ...slot }));
  }
  return result;
}

// Generate an empty timetable layout (35 periods for 5 days * 7 periods) for all classes
export function createEmptyTimetable(classes: ClassInfo[]): Timetable {
  const timetable: Timetable = {};
  
  classes.forEach(cls => {
    const slots: ScheduleSlot[] = [];
    // Days: 2 (Monday) to 6 (Friday)
    for (let day = 2; day <= 6; day++) {
      // Periods: 1 to 4 (Morning), 5 to 7 (Afternoon)
      for (let period = 1; period <= 7; period++) {
        // Default locked settings
        let subjectId: string | null = null;
        let teacherId: string | null = null;
        let isLocked = false;

        // Monday Period 1 is "Chào cờ"
        if (day === 2 && period === 1) {
          subjectId = "CC";
          teacherId = cls.advisorId; // Assumed flags ceremony is led by the class advisor
          isLocked = true;
        }
        
        // Friday Period 4 is "Sinh hoạt lớp"
        if (day === 6 && period === 4) {
          subjectId = "SHL";
          teacherId = cls.advisorId;
          isLocked = true;
        }

        // Friday Afternoon is Off (Nghỉ chiều thứ 6)
        if (day === 6 && period >= 5) {
          isLocked = true; // Closed
        }

        slots.push({
          day,
          period,
          subjectId,
          teacherId,
          isLocked
        });
      }
    }
    timetable[cls.id] = slots;
  });

  return timetable;
}

// Analyze the schedule for all classes and detect conflicts or warnings
export function auditTimetable(
  timetable: Timetable,
  classes: ClassInfo[],
  teachers: Teacher[],
  subjects: Subject[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // 1. Check Friday Afternoon Off constraint
  for (const classId in timetable) {
    timetable[classId].forEach(slot => {
      if (slot.day === 6 && slot.period >= 5 && slot.subjectId !== null) {
        conflicts.push({
          type: "off_friday_afternoon",
          message: `Lớp ${classId} có lịch học vào chiều Thứ Sáu (${slot.subjectId}) mặc dù chiều Thứ Sáu quy định nghỉ.`,
          severity: "error",
          classId,
          day: slot.day,
          period: slot.period,
          subjectId: slot.subjectId
        });
      }
    });
  }

  // 2. Check Teacher Double-Bookings (A teacher cannot be in two classrooms at the exact same period)
  // Group slots by [day][period][teacherId]
  const teacherSchedule: { [key: string]: { classId: string; subjectId: string }[] } = {};

  for (const classId in timetable) {
    timetable[classId].forEach(slot => {
      if (slot.teacherId && slot.subjectId && slot.subjectId !== "CC") { // Skip CC if it does not require a teacher, though we mapped the advisor as placeholder
        // Chào cờ can be led by advisor inside their classroom or school yard. 
        // But if high-priority, let's treat "CC" separately. In standard schools, all teachers are on duty.
        const key = `${slot.day}-${slot.period}-${slot.teacherId}`;
        if (!teacherSchedule[key]) {
          teacherSchedule[key] = [];
        }
        teacherSchedule[key].push({ classId, subjectId: slot.subjectId });
      }
    });
  }

  for (const key in teacherSchedule) {
    const list = teacherSchedule[key];
    if (list.length > 1) {
      const [dayStr, periodStr, teacherId] = key.split("-");
      const teacher = teachers.find(t => t.id === teacherId);
      const teacherName = teacher ? teacher.name : teacherId;
      const dayName = `Thứ ${dayStr}`;
      const periodName = `Tiết ${periodStr}`;

      const classList = list.map(item => `${item.classId} (${item.subjectId})`).join(", ");
      
      list.forEach(item => {
        conflicts.push({
          type: "teacher_double_booking",
          message: `Giáo viên ${teacherName} bị trùng lịch dạy cùng lúc: ${classList} vào ${dayName}, ${periodName}.`,
          severity: "error",
          classId: item.classId,
          day: parseInt(dayStr),
          period: parseInt(periodStr),
          teacherId,
          subjectId: item.subjectId
        });
      });
    }
  }

  // 3. Functional Room Overlap (Phòng học chức năng bị trùng lắp: Tin học, Âm nhạc)
  const roomSchedule: { [key: string]: { classId: string; subjectId: string }[] } = {};

  for (const classId in timetable) {
    const cls = classes.find(c => c.id === classId);
    timetable[classId].forEach(slot => {
      if (slot.subjectId) {
        const subject = subjects.find(s => s.id === slot.subjectId);
        if (subject?.isFunctionalRoomRequired && subject.functionalRoomName) {
          const roomKey = `${slot.day}-${slot.period}-${subject.functionalRoomName}`;
          if (!roomSchedule[roomKey]) {
            roomSchedule[roomKey] = [];
          }
          roomSchedule[roomKey].push({ classId, subjectId: slot.subjectId });
        }
      }
    });
  }

  for (const roomKey in roomSchedule) {
    const list = roomSchedule[roomKey];
    if (list.length > 1) {
      // For outdoor yard (Sân thể chất), maybe multiple classes is fine, but Informatics room can only hold 1 class!
      // Let's enforce 1 class limit for computer rooms/music rooms. For Yard, up to 2 classes.
      const [dayStr, periodStr, roomName] = roomKey.split("-");
      const maxLimit = roomName.includes("Sân") ? 2 : 1;

      if (list.length > maxLimit) {
        const classNames = list.map(x => x.classId).join(", ");
        list.forEach(item => {
          conflicts.push({
            type: "room_overlap",
            message: `Phòng/Sân '${roomName}' vượt quá công suất (đang có ${list.length} lớp học: ${classNames}) vào Thứ ${dayStr}, Tiết ${periodStr}.`,
            severity: "error",
            classId: item.classId,
            day: parseInt(dayStr),
            period: parseInt(periodStr),
            subjectId: item.subjectId
          });
        });
      }
    }
  }

  // 4. Check subject period quotas for each class (Mismatch between completed schedule and curriculum standards)
  for (const classId in timetable) {
    const cls = classes.find(c => c.id === classId);
    if (!cls) continue;

    const classGrade = cls.grade;
    const slots = timetable[classId];

    // Count scheduled periods for each subject
    const counts: { [subjectId: string]: number } = {};
    slots.forEach(slot => {
      if (slot.subjectId) {
        counts[slot.subjectId] = (counts[slot.subjectId] || 0) + 1;
      }
    });

    // Check against standard quotas
    subjects.forEach(subject => {
      const required = subject.periodsPerWeek[classGrade] || 0;
      const scheduled = counts[subject.id] || 0;

      if (scheduled !== required) {
        conflicts.push({
          type: "quota_mismatch",
          message: `Lớp ${classId} môn '${subject.name}' có ${scheduled}/${required} tiết trong tuần.`,
          severity: "warning",
          classId,
          subjectId: subject.id
        });
      }
    });
  }

  // 5. Total scheduled hours / workload for teachers weekly report
  const teacherHours: { [teacherId: string]: number } = {};
  for (const classId in timetable) {
    timetable[classId].forEach(slot => {
      if (slot.teacherId && slot.subjectId && slot.subjectId !== "CC" && slot.subjectId !== "SHL") {
        teacherHours[slot.teacherId] = (teacherHours[slot.teacherId] || 0) + 1;
      }
    });
  }

  teachers.forEach(teacher => {
    const hours = teacherHours[teacher.id] || 0;
    if (hours > teacher.maxPeriodsPerWeek) {
      conflicts.push({
        type: "workload_exceeded",
        message: `Giáo viên ${teacher.name} đang dạy ${hours} tiết/tuần, vượt định mức tối đa (${teacher.maxPeriodsPerWeek} tiết).`,
        severity: "warning",
        teacherId: teacher.id
      });
    }
  });

  return conflicts;
}

// Automatically distribute classes and arrange timetables using constructive heuristic priorities.
export function generateSchedule(
  classes: ClassInfo[],
  teachers: Teacher[],
  subjects: Subject[]
): Timetable {
  // Step 1: Create an empty schedule base with fixed slots (Chào cờ, Sinh hoạt lớp, closed Friday afternoon)
  const timetable = createEmptyTimetable(classes);
  
  // Step 2: Establish teacher assignments for each class's subjects.
  // We'll create a list of lesson elements that need placement for each class.
  // Each lesson structure: { classId, subjectId, teacherId }
  const classGradeRequiredLessons: { [classId: string]: { subjectId: string; teacherId: string }[] } = {};

  classes.forEach(cls => {
    const list: { subjectId: string; teacherId: string }[] = [];
    const grade = cls.grade;

    subjects.forEach(sub => {
      // Skip fixed/locked subjects as they are pre-placed in 'createEmptyTimetable'
      if (sub.id === "CC" || sub.id === "SHL") return;

      const periodsCount = sub.periodsPerWeek[grade] || 0;
      if (periodsCount === 0) return;

      // Determine correct teacher for this subject in this class
      let teacherId = "";

      // 1. Special subject selection (Tin học, GDTC, Âm nhạc, Mỹ thuật, Công nghệ, Tiếng Anh)
      if (sub.id === "GDTC") {
        // Teacher GDTC_HUONG
        teacherId = "GV_GDTC_HUONG";
      } else if (sub.id === "AN") {
        teacherId = "GV_NHAC_LINH";
      } else if (sub.id === "MT") {
        teacherId = "GV_MYTHUAT_TUNG";
      } else if (sub.id === "TH" || sub.id === "CN") {
        teacherId = "GV_TINHOC_HUY";
      } else if (sub.id === "TA") {
        // Distribute English classes between Helen and Nam: Helen gets Grades 1, 2, 3. Nam gets Grades 4, 5
        teacherId = cls.grade <= 3 ? "GV_TA_HELEN" : "GV_TA_NAM";
      } else {
        // Default to class's own advisor (Vietnamese, Math, Ethics, TNXH, Science, Hist/Geo, Experiential, Tutorial)
        teacherId = cls.advisorId;
      }

      for (let i = 0; i < periodsCount; i++) {
        list.push({ subjectId: sub.id, teacherId });
      }
    });

    classGradeRequiredLessons[cls.id] = list;
  });

  // Step 3: Schedule Shared Specialist Teachers first!
  // To avoid deadlocks, specialist teachers are a critical bottleneck.
  // We extract all lessons requiring specialist teachers and sort them or process them class-by-class.
  // Instead of simple random search, let's process lessons requiring shared teachers across all classes.
  const specialistTeachers = new Set([
    "GV_GDTC_HUONG", "GV_NHAC_LINH", "GV_MYTHUAT_TUNG", "GV_TINHOC_HUY", "GV_TA_HELEN", "GV_TA_NAM"
  ]);

  // Aggregate all lessons
  interface UnplacedLesson {
    classId: string;
    subjectId: string;
    teacherId: string;
    isSpecialist: boolean;
  }

  const unplacedLessons: UnplacedLesson[] = [];
  classes.forEach(cls => {
    classGradeRequiredLessons[cls.id].forEach(item => {
      unplacedLessons.push({
        classId: cls.id,
        subjectId: item.subjectId,
        teacherId: item.teacherId,
        isSpecialist: specialistTeachers.has(item.teacherId)
      });
    });
  });

  // Sort: Specialist lessons first, then general lessons.
  // Among specialists, sort by subjects with more constraints (e.g. GDTC vs Music)
  unplacedLessons.sort((a, b) => {
    if (a.isSpecialist && !b.isSpecialist) return -1;
    if (!a.isSpecialist && b.isSpecialist) return 1;
    
    // Sort by classId to bundle class schedules, helping subject distribution
    return a.classId.localeCompare(b.classId);
  });

  // Helper: check if a target slot has a teacher double-booking, room overlap, or subject limit
  function isValidPlacement(
    currTimetable: Timetable,
    classId: string,
    day: number,
    period: number,
    subjectId: string,
    teacherId: string
  ): boolean {
    // 1. Check if the slot in this class is already occupied
    const classSlots = currTimetable[classId];
    const targetSlot = classSlots.find(s => s.day === day && s.period === period);
    if (!targetSlot || targetSlot.subjectId !== null || targetSlot.isLocked) {
      return false;
    }

    // 2. Teacher double-booking check: is this teacher teaching some other class at this day/period?
    for (const cId in currTimetable) {
      if (cId === classId) continue;
      const otherSlot = currTimetable[cId].find(s => s.day === day && s.period === period);
      if (otherSlot && otherSlot.teacherId === teacherId && otherSlot.subjectId !== "CC") {
        return false;
      }
    }

    // 3. Functional Room constraint
    const subject = subjects.find(s => s.id === subjectId);
    if (subject?.isFunctionalRoomRequired && subject.functionalRoomName) {
      const roomName = subject.functionalRoomName;
      let occupantCount = 0;
      
      for (const cId in currTimetable) {
        const otherSlot = currTimetable[cId].find(s => s.day === day && s.period === period);
        if (otherSlot && otherSlot.subjectId) {
          const otherSub = subjects.find(s => s.id === otherSlot.subjectId);
          if (otherSub?.isFunctionalRoomRequired && otherSub?.functionalRoomName === roomName) {
            occupantCount++;
          }
        }
      }

      const limit = roomName.includes("Sân") ? 2 : 1; // Sân yard can have up to 2 classes, computer lab only 1
      if (occupantCount >= limit) {
        return false;
      }
    }

    // 4. Ensure same subject does not appear more than 2 times in a single day
    const dayLessons = classSlots.filter(s => s.day === day && s.subjectId === subjectId);
    if (dayLessons.length >= 2) {
      return false;
    }

    // 5. Pedagogical rule: Try to balance morning and afternoons (optional, let's keep it relaxed)

    return true;
  }

  // Greedy scheduling algorithm with light backtracking or sequential attempts
  // Try to place each lesson in the best fitting conflict-free slot.
  const failedLessons: UnplacedLesson[] = [];

  unplacedLessons.forEach(lesson => {
    let placed = false;

    // We search the 5 days (2 to 6) and 7 periods (1 to 7)
    // To make distribution natural, let's iterate days or pick a slot that fits well.
    // For specialists, we might prefer Mornings (periods 1-4) or afternoons (5-7) depending on subject.
    // Let's establish a search list of slots.
    const searchSlots: { day: number; period: number }[] = [];
    for (let day = 2; day <= 6; day++) {
      for (let period = 1; period <= 7; period++) {
        // Skip Friday afternoon entirely
        if (day === 6 && period >= 5) continue;
        searchSlots.push({ day, period });
      }
    }

    // Shuffle search slots slightly or prioritize based on lesson type:
    // PE/GDTC, Fine Arts, Music etc. can sometimes belong in the middle of days.
    // Let's try placing in first available slot that satisfies valid placement.
    for (const slot of searchSlots) {
      if (isValidPlacement(timetable, lesson.classId, slot.day, slot.period, lesson.subjectId, lesson.teacherId)) {
        const classSlots = timetable[lesson.classId];
        const s = classSlots.find(x => x.day === slot.day && x.period === slot.period);
        if (s) {
          s.subjectId = lesson.subjectId;
          s.teacherId = lesson.teacherId;
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      // If we failed to place conflict-free, list it to place forcefully in any empty slot later to keep schedule full,
      // then user can adjust manually, showing where conflicts are.
      failedLessons.push(lesson);
    }
  });

  // Force-place any failed lessons to preserve period quotas and show conflicts clearly
  failedLessons.forEach(lesson => {
    // Audit empty slots remains
    const classSlots = timetable[lesson.classId];
    const emptySlot = classSlots.find(s => s.subjectId === null && !s.isLocked);
    if (emptySlot) {
      emptySlot.subjectId = lesson.subjectId;
      emptySlot.teacherId = lesson.teacherId;
    }
  });

  return timetable;
}
