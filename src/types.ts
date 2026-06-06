export interface Subject {
  id: string; // e.g. "TOAN", "TVIET", "ANH", etc.
  name: string;
  shortName: string;
  color: string; // tailwind color class
  periodsPerWeek: { [grade: number]: number }; // standard periods required per grade level (1 to 5)
  isFunctionalRoomRequired?: boolean;
  functionalRoomName?: string;
}

export interface Teacher {
  id: string;
  name: string;
  shortName: string;
  subjectIds: string[]; // subjects they can teach
  isAdvisorOfClassId?: string; // class they are advisor of (for Homeroom/Sinh hoạt lớp)
  maxPeriodsPerWeek: number; // workload capacity
  preferredOffHalfDays?: string[]; // e.g. ["Mon_PM", "Tue_AM"] preferred free times
  color?: string;
}

export interface ClassInfo {
  id: string; // e.g., "1A1", "1A2", "5A3"
  name: string;
  grade: number; // 1, 2, 3, 4, 5
  advisorId: string; // teacher who leads the class
  classroomName: string;
}

// Representing a period in the week
// Day is 2 (Monday) to 6 (Friday)
// Period is 1 to 7 (1-4: Morning, 5-7: Afternoon)
export interface ScheduleSlot {
  day: number; // 2 -> 6 (Monday -> Friday)
  period: number; // 1 -> 4 (sáng), 5 -> 7 (chiều)
  subjectId: string | null;
  teacherId: string | null;
  room?: string;
  isLocked?: boolean; // locked slots (like Chào cờ or Sinh hoạt lớp)
}

// The entire timetable consists of schedules for all classes
// Key is classId, value is list of schedule slots
export interface Timetable {
  [classId: string]: ScheduleSlot[];
}

// Evaluation conflict report
export interface ScheduleConflict {
  type: "teacher_double_booking" | "room_overlap" | "quota_mismatch" | "off_friday_afternoon" | "workload_exceeded";
  message: string;
  severity: "error" | "warning";
  classId?: string;
  day?: number;
  period?: number;
  teacherId?: string;
  subjectId?: string;
}

export interface AppState {
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassInfo[];
  timetable: Timetable;
  apiKey: string;
  selectedModel: string;
}
