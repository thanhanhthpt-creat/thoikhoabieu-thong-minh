import { Subject, ClassInfo, Teacher, Timetable, ScheduleSlot } from "./types";

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: "CC",
    name: "Chào cờ",
    shortName: "Chào cờ",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    periodsPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
  },
  {
    id: "TOAN",
    name: "Toán",
    shortName: "Toán",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    periodsPerWeek: { 1: 3, 2: 3, 3: 3, 4: 5, 5: 5 }
  },
  {
    id: "TVIET",
    name: "Tiếng Việt",
    shortName: "T.Việt",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    periodsPerWeek: { 1: 10, 2: 9, 3: 8, 4: 7, 5: 7 }
  },
  {
    id: "TA",
    name: "Tiếng Anh",
    shortName: "T.Anh",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    periodsPerWeek: { 1: 2, 2: 2, 3: 4, 4: 4, 5: 4 }
  },
  {
    id: "DD",
    name: "Đạo đức",
    shortName: "Đạo đức",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    periodsPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
  },
  {
    id: "TNXH",
    name: "Tự nhiên và Xã hội",
    shortName: "TN&XH",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    periodsPerWeek: { 1: 2, 2: 2, 3: 2, 4: 0, 5: 0 }
  },
  {
    id: "KH",
    name: "Khoa học",
    shortName: "K.Học",
    color: "bg-amber-600/10 text-amber-700 border-amber-600/20",
    periodsPerWeek: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 2 }
  },
  {
    id: "LSDLY",
    name: "Lịch sử và Địa lý",
    shortName: "LS&ĐL",
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    periodsPerWeek: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 2 }
  },
  {
    id: "GDTC",
    name: "Thể dục (GDTC)",
    shortName: "Thể dục",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    periodsPerWeek: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 },
    isFunctionalRoomRequired: true,
    functionalRoomName: "Sân thể chất"
  },
  {
    id: "AN",
    name: "Âm nhạc",
    shortName: "Â.Nhạc",
    color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    periodsPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
    isFunctionalRoomRequired: true,
    functionalRoomName: "Phòng Âm nhạc"
  },
  {
    id: "MT",
    name: "Mỹ thuật",
    shortName: "M.Thuật",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    periodsPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
  },
  {
    id: "TH",
    name: "Tin học",
    shortName: "Tin học",
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    periodsPerWeek: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 },
    isFunctionalRoomRequired: true,
    functionalRoomName: "Phòng Tin học"
  },
  {
    id: "CN",
    name: "Công nghệ",
    shortName: "C.Nghệ",
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    periodsPerWeek: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 }
  },
  {
    id: "HDTN",
    name: "Hoạt động Trải nghiệm",
    shortName: "HĐTN",
    color: "bg-lime-500/10 text-lime-600 border-lime-500/20",
    periodsPerWeek: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 }
  },
  {
    id: "TUHOC",
    name: "Tự học có hướng dẫn",
    shortName: "Tự học",
    color: "bg-neutral-500/10 text-neutral-600 border-neutral-500/20",
    periodsPerWeek: { 1: 5, 2: 6, 3: 3, 4: 1, 5: 1 }
  },
  {
    id: "SHL",
    name: "Sinh hoạt lớp",
    shortName: "S.Hoạt",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    periodsPerWeek: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
  }
];

export const DEFAULT_CLASSES: ClassInfo[] = [
  { id: "1A1", name: "1A1", grade: 1, advisorId: "GV_ANH_MINH", classroomName: "Phòng 101" },
  { id: "1A2", name: "1A2", grade: 1, advisorId: "GV_LAN_ANH", classroomName: "Phòng 102" },
  { id: "1A3", name: "1A3", grade: 1, advisorId: "GV_HOAI_PHUONG", classroomName: "Phòng 103" },
  { id: "2A1", name: "2A1", grade: 2, advisorId: "GV_XUAN_TUNG", classroomName: "Phòng 201" },
  { id: "2A2", name: "2A2", grade: 2, advisorId: "GV_NGOC_MAI", classroomName: "Phòng 202" },
  { id: "2A3", name: "2A3", grade: 2, advisorId: "GV_THU_HA", classroomName: "Phòng 203" },
  { id: "3A1", name: "3A1", grade: 3, advisorId: "GV_QUOC_KHANH", classroomName: "Phòng 301" },
  { id: "3A2", name: "3A2", grade: 3, advisorId: "GV_CAM_VAN", classroomName: "Phòng 302" },
  { id: "3A3", name: "3A3", grade: 3, advisorId: "GV_HONG_NHUNG", classroomName: "Phòng 303" },
  { id: "4A1", name: "4A1", grade: 4, advisorId: "GV_MINH_TRIET", classroomName: "Phòng 401" },
  { id: "4A2", name: "4A2", grade: 4, advisorId: "GV_THANH_HUYEN", classroomName: "Phòng 402" },
  { id: "4A3", name: "4A3", grade: 4, advisorId: "GV_THI_VIET", classroomName: "Phòng 403" },
  { id: "5A1", name: "5A1", grade: 5, advisorId: "GV_DUC_MANH", classroomName: "Phòng 501" },
  { id: "5A2", name: "5A2", grade: 5, advisorId: "GV_PHUONG_THAO", classroomName: "Phòng 502" },
  { id: "5A3", name: "5A3", grade: 5, advisorId: "GV_HAI_YEN", classroomName: "Phòng 503" }
];

export const DEFAULT_TEACHERS: Teacher[] = [
  // 15 Homeroom Advisors (Advisors can teach general primary school courses like Toán, T.Việt, Đạo đức, TNXH, Khoa học, Sử-Địa, HĐTN, Tự học)
  {
    id: "GV_ANH_MINH",
    name: "Nguyễn Anh Minh",
    shortName: "T. Minh",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "1A1",
    maxPeriodsPerWeek: 26,
    color: "bg-red-500",
  },
  {
    id: "GV_LAN_ANH",
    name: "Phạm Lan Anh",
    shortName: "C. L.Anh",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "1A2",
    maxPeriodsPerWeek: 26,
    color: "bg-orange-500"
  },
  {
    id: "GV_HOAI_PHUONG",
    name: "Lê Hoài Phương",
    shortName: "C. Phương",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "1A3",
    maxPeriodsPerWeek: 26,
    color: "bg-amber-500"
  },
  {
    id: "GV_XUAN_TUNG",
    name: "Bùi Xuân Tùng",
    shortName: "T. Tùng",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "2A1",
    maxPeriodsPerWeek: 26,
    color: "bg-yellow-500"
  },
  {
    id: "GV_NGOC_MAI",
    name: "Trần Ngọc Mai",
    shortName: "C. Mai",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "2A2",
    maxPeriodsPerWeek: 26,
    color: "bg-lime-500"
  },
  {
    id: "GV_THU_HA",
    name: "Đỗ Thu Hà",
    shortName: "C. Hà",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "2A3",
    maxPeriodsPerWeek: 26,
    color: "bg-green-500"
  },
  {
    id: "GV_QUOC_KHANH",
    name: "Phùng Quốc Khánh",
    shortName: "T. Khánh",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "3A1",
    maxPeriodsPerWeek: 26,
    color: "bg-emerald-500"
  },
  {
    id: "GV_CAM_VAN",
    name: "Vũ Cẩm Vân",
    shortName: "C. Vân",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "3A2",
    maxPeriodsPerWeek: 26,
    color: "bg-teal-500"
  },
  {
    id: "GV_HONG_NHUNG",
    name: "Nguyễn Hồng Nhung",
    shortName: "C. Nhung",
    subjectIds: ["TOAN", "TVIET", "DD", "TNXH", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "3A3",
    maxPeriodsPerWeek: 26,
    color: "bg-cyan-500"
  },
  {
    id: "GV_MINH_TRIET",
    name: "Hồ Minh Triết",
    shortName: "T. Triết",
    subjectIds: ["TOAN", "TVIET", "DD", "KH", "LSDLY", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "4A1",
    maxPeriodsPerWeek: 26,
    color: "bg-sky-500"
  },
  {
    id: "GV_THANH_HUYEN",
    name: "Nguyễn Thanh Huyền",
    shortName: "C. Huyền",
    subjectIds: ["TOAN", "TVIET", "DD", "KH", "LSDLY", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "4A2",
    maxPeriodsPerWeek: 26,
    color: "bg-indigo-500"
  },
  {
    id: "GV_THI_VIET",
    name: "Tô Thị Việt",
    shortName: "C. Việt",
    subjectIds: ["TOAN", "TVIET", "DD", "KH", "LSDLY", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "4A3",
    maxPeriodsPerWeek: 26,
    color: "bg-violet-500"
  },
  {
    id: "GV_DUC_MANH",
    name: "Trịnh Đức Mạnh",
    shortName: "T. Mạnh",
    subjectIds: ["TOAN", "TVIET", "DD", "KH", "LSDLY", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "5A1",
    maxPeriodsPerWeek: 26,
    color: "bg-purple-500"
  },
  {
    id: "GV_PHUONG_THAO",
    name: "Đặng Phương Thảo",
    shortName: "C. Thảo",
    subjectIds: ["TOAN", "TVIET", "DD", "KH", "LSDLY", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "5A2",
    maxPeriodsPerWeek: 26,
    color: "bg-fuchsia-500"
  },
  {
    id: "GV_HAI_YEN",
    name: "Hoàng Hải Yến",
    shortName: "C. Yến",
    subjectIds: ["TOAN", "TVIET", "DD", "KH", "LSDLY", "HDTN", "TUHOC", "SHL", "CC"],
    isAdvisorOfClassId: "5A3",
    maxPeriodsPerWeek: 26,
    color: "bg-rose-500"
  },

  // 5 Specialist Teachers
  {
    id: "GV_TA_HELEN",
    name: "Helen Nguyễn",
    shortName: "C. Helen (Anh)",
    subjectIds: ["TA"],
    maxPeriodsPerWeek: 24,
    color: "bg-pink-600"
  },
  {
    id: "GV_TA_NAM",
    name: "Trần Nam",
    shortName: "T. Nam (Anh)",
    subjectIds: ["TA"],
    maxPeriodsPerWeek: 24,
    color: "bg-indigo-600"
  },
  {
    id: "GV_GDTC_HUONG",
    name: "Nguyễn Văn Hùng",
    shortName: "T. Hùng (Thể dục)",
    subjectIds: ["GDTC"],
    maxPeriodsPerWeek: 30,
    color: "bg-orange-700"
  },
  {
    id: "GV_NHAC_LINH",
    name: "Vũ Khánh Linh",
    shortName: "C. Linh (Nhạc)",
    subjectIds: ["AN"],
    maxPeriodsPerWeek: 18,
    color: "bg-rose-600"
  },
  {
    id: "GV_MYTHUAT_TUNG",
    name: "Phan Thanh Tùng",
    shortName: "T. Tùng (Vẽ)",
    subjectIds: ["MT"],
    maxPeriodsPerWeek: 18,
    color: "bg-amber-700"
  },
  {
    id: "GV_TINHOC_HUY",
    name: "Tạ Quang Huy",
    shortName: "T. Huy (Tin-CN)",
    subjectIds: ["TH", "CN"],
    maxPeriodsPerWeek: 24,
    color: "bg-teal-700"
  }
];
