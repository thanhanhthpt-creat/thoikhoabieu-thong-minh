import React, { useState } from "react";
import { ClassInfo, Teacher, Subject } from "../types";
import { ListPlus, Trash2, Edit2, Plus, Sparkles, Check, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";

interface SetupDataProps {
  classes: ClassInfo[];
  teachers: Teacher[];
  subjects: Subject[];
  onUpdateClasses: (classes: ClassInfo[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
}

export const SetupData: React.FC<SetupDataProps> = ({
  classes,
  teachers,
  subjects,
  onUpdateClasses,
  onUpdateTeachers,
  onUpdateSubjects
}) => {
  const [subTab, setSubTab] = useState<"classes" | "teachers" | "subjects">("classes");

  // Forms states
  const [classForm, setClassForm] = useState({ id: "", name: "", grade: 1, advisorId: "", classroomName: "" });
  const [teacherForm, setTeacherForm] = useState({ id: "", name: "", shortName: "", subjectIds: [] as string[], maxPeriodsPerWeek: 26 });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Validate Class Forms
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.id || !classForm.name) return;

    if (editingId) {
      // Edit
      const updated = classes.map(c => c.id === editingId ? { ...classForm, id: editingId } : c);
      onUpdateClasses(updated);
      setEditingId(null);
    } else {
      // Create
      if (classes.some(c => c.id === classForm.id)) {
        alert("Mã lớp học này đã tồn tại!");
        return;
      }
      onUpdateClasses([...classes, classForm]);
    }
    setClassForm({ id: "", name: "", grade: 1, advisorId: "", classroomName: "" });
  };

  const handleEditClass = (c: ClassInfo) => {
    setClassForm(c);
    setEditingId(c.id);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa Lớp ${id} khỏi hệ thống không? Dữ liệu thời khóa biểu lớp này cũng sẽ trống.`)) {
      onUpdateClasses(classes.filter(c => c.id !== id));
    }
  };

  // Validate Teacher Forms
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.id || !teacherForm.name || !teacherForm.shortName) return;

    if (editingId) {
      const updated = teachers.map(t => t.id === editingId ? { ...teacherForm, id: editingId } : t);
      onUpdateTeachers(updated);
      setEditingId(null);
    } else {
      if (teachers.some(t => t.id === teacherForm.id)) {
        alert("Mã giáo viên này đã tồn tại!");
        return;
      }
      onUpdateTeachers([...teachers, { ...teacherForm, color: getRandomTailwindBg() }]);
    }
    setTeacherForm({ id: "", name: "", shortName: "", subjectIds: [], maxPeriodsPerWeek: 26 });
  };

  const handleEditTeacher = (t: Teacher) => {
    setTeacherForm({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      subjectIds: t.subjectIds,
      maxPeriodsPerWeek: t.maxPeriodsPerWeek
    });
    setEditingId(t.id);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm(`Xóa giáo viên '${id}' sẽ rút họ khỏi các phân bổ thời khóa biểu đang chạy. Xác nhận xóa?`)) {
      onUpdateTeachers(teachers.filter(t => t.id !== id));
    }
  };

  // Validate Subject Quota Form
  const handleSubjectPeriodsChange = (subjectId: string, grade: number, value: number) => {
    const updated = subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          periodsPerWeek: {
            ...s.periodsPerWeek,
            [grade]: value
          }
        };
      }
      return s;
    });
    onUpdateSubjects(updated);
  };

  const getRandomTailwindBg = () => {
    const bgs = ["bg-blue-500", "bg-emerald-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-teal-500", "bg-orange-500"];
    return bgs[Math.floor(Math.random() * bgs.length)];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Quản lý Danh mục Trường học</h3>
          <p className="text-xs text-slate-500">Cấu hình các danh mục Lớp, Giáo viên và điều chỉnh định mức môn học</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => { setSubTab("classes"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition duration-150 ${subTab === "classes" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Lớp học ({classes.length})
          </button>
          <button
            onClick={() => { setSubTab("teachers"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition duration-150 ${subTab === "teachers" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Giáo viên ({teachers.length})
          </button>
          <button
            onClick={() => { setSubTab("subjects"); setEditingId(null); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition duration-150 ${subTab === "subjects" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Môn học ({subjects.length})
          </button>
        </div>
      </div>

      {/* CLASSTAB CONTROLS */}
      {subTab === "classes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Form panel */}
          <div className="bg-slate-50/55 border border-slate-150 p-5 rounded-2xl h-fit">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">
              {editingId ? "✍️ Cập nhật Lớp học" : "➕ Thêm Lớp học mới"}
            </h4>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mã Lớp (Dùng cho TKB)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 1A1, 5A2"
                  disabled={!!editingId}
                  value={classForm.id}
                  onChange={(e) => setClassForm({ ...classForm, id: e.target.value.toUpperCase().trim() })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên Lớp học hiển thị</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lớp 1A1"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Khối lớp (Grade)</label>
                  <select
                    value={classForm.grade}
                    onChange={(e) => setClassForm({ ...classForm, grade: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map(g => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phòng Học</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phòng 101"
                    value={classForm.classroomName}
                    onChange={(e) => setClassForm({ ...classForm, classroomName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Giáo viên chủ nhiệm</label>
                <select
                  required
                  value={classForm.advisorId}
                  onChange={(e) => setClassForm({ ...classForm, advisorId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">-- Chọn Giáo Viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/10 transition"
                >
                  {editingId ? "Cập nhật" : "Tạo mới"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setClassForm({ id: "", name: "", grade: 1, advisorId: "", classroomName: "" }); }}
                    className="px-3 py-2 bg-slate-250 text-slate-650 hover:bg-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Classes list directory */}
          <div className="lg:col-span-2 overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold font-mono tracking-wider">
                  <th className="p-3">Mã Lớp</th>
                  <th className="p-3">Tên Lớp</th>
                  <th className="p-3">Chủ Nhiệm</th>
                  <th className="p-3">Khối</th>
                  <th className="p-3">Phòng Học</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-800">{c.id}</td>
                    <td className="p-3 font-semibold text-slate-700">{c.name}</td>
                    <td className="p-3 text-slate-600">
                      {teachers.find(t => t.id === c.advisorId)?.name || c.advisorId}
                    </td>
                    <td className="p-3 text-slate-500">Khối {c.grade}</td>
                    <td className="p-3 text-slate-500 font-medium">{c.classroomName}</td>
                    <td className="p-3 text-right flex gap-1.5 justify-end">
                      <button
                        onClick={() => handleEditClass(c)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg text-xs font-semibold transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(c.id)}
                        className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEACHERSTAB CONTROLS */}
      {subTab === "teachers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher creation Form */}
          <div className="bg-slate-50/55 border border-slate-150 p-5 rounded-2xl h-fit">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">
              {editingId ? "✍️ Cập nhật Giáo viên" : "➕ Thêm Giáo viên mới"}
            </h4>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mã Giáo viên (ID Tương tác)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: GV_MINH_TAM"
                  disabled={!!editingId}
                  value={teacherForm.id}
                  onChange={(e) => setTeacherForm({ ...teacherForm, id: e.target.value.toUpperCase().trim() })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Họ và Tên</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Nhật Nam"
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tên viết tắt</label>
                  <input
                    type="text"
                    required
                    placeholder="T. Nam"
                    value={teacherForm.shortName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Định mức tiết tối đa/Tuần</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={40}
                  value={teacherForm.maxPeriodsPerWeek}
                  onChange={(e) => setTeacherForm({ ...teacherForm, maxPeriodsPerWeek: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Chuyên môn giảng dạy (được chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-2 bg-white border border-slate-150 rounded-xl">
                  {subjects.map(s => {
                    const isChecked = teacherForm.subjectIds.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTeacherForm({ ...teacherForm, subjectIds: [...teacherForm.subjectIds, s.id] });
                            } else {
                              setTeacherForm({ ...teacherForm, subjectIds: teacherForm.subjectIds.filter(id => id !== s.id) });
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/10 transition"
                >
                  {editingId ? "Cập nhật" : "Tạo mới"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setTeacherForm({ id: "", name: "", shortName: "", subjectIds: [], maxPeriodsPerWeek: 26 }); }}
                    className="px-3 py-2 bg-slate-250 text-slate-655 hover:bg-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Teachers list directory */}
          <div className="lg:col-span-2 overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold font-mono tracking-wider">
                  <th className="p-3">Họ Tên</th>
                  <th className="p-3">Tên Ngắn</th>
                  <th className="p-3">Chuyên Môn</th>
                  <th className="p-3 text-center">Định mức</th>
                  <th className="p-3 text-right">Lớp CN</th>
                  <th className="p-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 text-slate-700">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{t.name}</div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{t.id}</span>
                    </td>
                    <td className="p-3 font-mono text-sm">{t.shortName}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {t.subjectIds.map(sid => (
                          <span key={sid} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md border border-blue-100/30">
                            {sid}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold">{t.maxPeriodsPerWeek} tiết</td>
                    <td className="p-3 text-right pr-4 font-bold text-indigo-600">
                      {t.isAdvisorOfClassId ? `Lớp ${t.isAdvisorOfClassId}` : "--"}
                    </td>
                    <td className="p-3 text-right flex gap-1.5 justify-end mt-1">
                      <button
                        onClick={() => handleEditTeacher(t)}
                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg text-xs font-semibold transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(t.id)}
                        className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBJECTSTAB CONTROLS */}
      {subTab === "subjects" && (
        <div>
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 border border-blue-100 rounded-xl mb-6 text-xs">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Định cấu hình số tiết học bắt buộc trong 1 tuần của từng môn học phân bổ cho các khối lớp từ 1 đến 5. Thay đổi lập tức thay đổi hệ thống ném bom tiết dạy quy chuẩn!</span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 text-xs font-bold font-mono tracking-wider">
                  <th className="p-4 w-1/4">Tên môn học</th>
                  <th className="p-4 text-center">Khối 1</th>
                  <th className="p-4 text-center">Khối 2</th>
                  <th className="p-4 text-center">Khối 3</th>
                  <th className="p-4 text-center">Khối 4</th>
                  <th className="p-4 text-center">Khối 5</th>
                  <th className="p-4 text-right">Phòng đặc thù</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/40 text-slate-700">
                    <td className="p-4">
                      <span className="font-bold text-slate-805 block">{s.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">{s.id}</span>
                    </td>

                    {[1, 2, 3, 4, 5].map(g => (
                      <td key={g} className="p-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={15}
                          disabled={s.id === "CC" || s.id === "SHL"} // Assembly & class meets are fixed standard
                          value={s.periodsPerWeek[g] || 0}
                          onChange={(e) => handleSubjectPeriodsChange(s.id, g, parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 bg-white border border-slate-200 text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none rounded-lg text-center font-mono font-semibold"
                        />
                      </td>
                    ))}

                    <td className="p-4 text-right">
                      {s.isFunctionalRoomRequired ? (
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium border border-indigo-100/40">
                          {s.functionalRoomName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Phòng học lớp</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
