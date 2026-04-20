"use client";

import { useState } from "react";
import { Student, Session, Attendance } from "@/lib/supabase/types";

interface Props {
  students: Student[];
  sessions: Session[];
  attendance: Attendance[];
  onStudentsChange: (s: Student[]) => void;
}

const emptyForm = {
  name: "", parent_name: "", time_slot: "",
  day_of_week: "sat" as "sat" | "sun",
  payment_status: "unpaid" as "paid" | "unpaid",
  course_type: "regular" as "regular" | "trial",
  parent_email: "", start_date: "",
};

type CourseFilter = "all" | "trial" | "regular";

export default function StudentManageTable({ students, sessions, attendance, onStudentsChange }: Props) {
  const [dayTab, setDayTab] = useState<"sat" | "sun">("sat");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  function getAttendedCount(studentId: string) {
    return attendance.filter((a) => a.student_id === studentId && !a.is_cancelled).length;
  }

  function startEdit(student: Student) {
    setEditId(student.id);
    setForm({ name: student.name, parent_name: student.parent_name, time_slot: student.time_slot, day_of_week: student.day_of_week, payment_status: student.payment_status, course_type: student.course_type, parent_email: student.parent_email ?? "", start_date: "" });
    setShowAdd(false);
  }

  async function saveEdit() {
    if (!editId) return;
    setLoading(true);
    const res = await fetch("/api/admin/students", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) });
    if (res.ok) { const u: Student = await res.json(); onStudentsChange(students.map((s) => s.id === editId ? u : s)); setEditId(null); }
    setLoading(false);
  }

  async function handleAdd() {
    setLoading(true);
    const res = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, start_date: form.start_date || new Date().toISOString().slice(0, 10) }) });
    if (res.ok) { const ns: Student = await res.json(); onStudentsChange([...students, ns]); setShowAdd(false); setForm(emptyForm); }
    setLoading(false);
  }

  async function handleQuickUpdate(id: string, field: string, value: string) {
    const res = await fetch("/api/admin/students", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [field]: value }) });
    if (res.ok) { const u: Student = await res.json(); onStudentsChange(students.map((s) => s.id === id ? u : s)); }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定刪除？")) return;
    setLoading(true);
    const res = await fetch("/api/admin/students", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { onStudentsChange(students.filter((s) => s.id !== id)); }
    setLoading(false);
  }

  const satCount = students.filter((s) => s.day_of_week === "sat").length;
  const sunCount = students.filter((s) => s.day_of_week === "sun").length;

  let displayed = students.filter((s) => s.day_of_week === dayTab);
  if (courseFilter !== "all") displayed = displayed.filter((s) => s.course_type === courseFilter);

  return (
    <div className="space-y-5">
      {/* Day + course filter row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["sat", "sun"] as const).map((d) => {
            const count = d === "sat" ? satCount : sunCount;
            const active = dayTab === d;
            return (
              <button key={d} onClick={() => setDayTab(d)}
                className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold transition-all ${active ? "bg-[#A67C52] text-white" : "bg-white text-[#9A8878] border border-[#EDE5D8] hover:border-[#A67C52]/40"}`}>
                {d === "sat" ? "週六" : "週日"}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-[#EDE5D8] text-[#9A8878]"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {(["all", "trial", "regular"] as CourseFilter[]).map((f) => (
            <button key={f} onClick={() => setCourseFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${courseFilter === f ? "bg-[#A67C52] text-white" : "text-[#9A8878] hover:text-[#A67C52]"}`}>
              {f === "all" ? "全部" : f === "trial" ? "試上" : "正式"}
            </button>
          ))}
          <div className="w-px h-5 bg-[#D4C8B8] mx-1" />
          <button onClick={() => { setShowAdd(true); setEditId(null); setForm(emptyForm); }} className="btn-gold text-sm px-4 py-1.5">
            + 新增
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-[#EDE5D8] p-5">
          <p className="font-bold text-[#2C2017] mb-4">新增學生</p>
          <EditForm form={form} setForm={setForm} onSave={handleAdd} onCancel={() => setShowAdd(false)} loading={loading} showStartDate />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F0E8] text-[#9A8878] text-xs font-semibold tracking-wide">
              <th className="text-left px-5 py-3.5">#</th>
              <th className="text-left px-5 py-3.5">學生姓名</th>
              <th className="text-left px-5 py-3.5">上課時段</th>
              <th className="text-left px-5 py-3.5">點數使用</th>
              <th className="text-left px-5 py-3.5">繳費狀態</th>
              <th className="text-left px-5 py-3.5">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {displayed.map((student, idx) => {
              const count = getAttendedCount(student.id);
              const pct = Math.round((count / 10) * 100);
              if (editId === student.id) {
                return (
                  <tr key={student.id}>
                    <td colSpan={6} className="px-5 py-4">
                      <EditForm form={form} setForm={setForm} onSave={saveEdit} onCancel={() => setEditId(null)} loading={loading} />
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={student.id} className="hover:bg-[#FBF8F3] transition-colors">
                  <td className="px-5 py-4 text-[#A67C52] font-bold">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#2C2017]">{student.name}
                      <span className="text-[#9A8878] font-normal ml-1">({student.parent_name})</span>
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[#9A8878]">{student.time_slot}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-1.5 min-w-[140px]">
                      <div className="flex justify-between text-xs text-[#9A8878]">
                        <span>{count} / 10 堂</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-[#EDE5D8] rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-[#A67C52] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => handleQuickUpdate(student.id, "payment_status", "paid")}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${student.payment_status === "paid" ? "bg-[#E8F5E9] text-[#4CAF50] border-[#C8E6C9]" : "bg-white text-[#9A8878] border-[#EDE5D8] hover:border-[#4CAF50]/50"}`}>
                          已繳
                        </button>
                        <button onClick={() => handleQuickUpdate(student.id, "payment_status", "unpaid")}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${student.payment_status === "unpaid" ? "bg-[#FFF0F0] text-[#E57373] border-[#FFCDD2]" : "bg-white text-[#9A8878] border-[#EDE5D8] hover:border-[#E57373]/50"}`}>
                          未繳
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleQuickUpdate(student.id, "course_type", "regular")}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${student.course_type === "regular" ? "bg-[#EEF2FF] text-[#7986CB] border-[#C5CAE9]" : "bg-white text-[#9A8878] border-[#EDE5D8] hover:border-[#7986CB]/50"}`}>
                          正式
                        </button>
                        <button onClick={() => handleQuickUpdate(student.id, "course_type", "trial")}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${student.course_type === "trial" ? "bg-[#FFF8E1] text-[#FF8F00] border-[#FFE082]" : "bg-white text-[#9A8878] border-[#EDE5D8] hover:border-[#FF8F00]/50"}`}>
                          試上
                        </button>
                        <button onClick={() => {}} title="補充點數"
                          className="text-xs font-semibold px-3 py-1 rounded-full border border-[#EDE5D8] text-[#9A8878] hover:border-[#A67C52]/50 transition-all">
                          補充
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(student)} className="text-xs text-[#A67C52] hover:underline font-medium">編輯</button>
                      <button onClick={() => handleDelete(student.id)} className="text-xs text-[#E57373] hover:underline font-medium">刪除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {displayed.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[#9A8878]">尚無資料</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditForm({ form, setForm, onSave, onCancel, loading, showStartDate = false }: {
  form: typeof emptyForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onSave: () => void; onCancel: () => void; loading: boolean; showStartDate?: boolean;
}) {
  const inp = "w-full border border-[#EDE5D8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40 bg-[#FBF8F3]";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["name","學生姓名"],["parent_name","家長姓名"],["time_slot","上課時段"]].map(([k,l]) => (
          <div key={k} className="space-y-1">
            <label className="text-xs font-medium text-[#9A8878]">{l}</label>
            <input value={(form as any)[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={inp} />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9A8878]">星期</label>
          <select value={form.day_of_week} onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value as any }))} className={inp}>
            <option value="sat">週六</option><option value="sun">週日</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9A8878]">繳費狀態</label>
          <select value={form.payment_status} onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value as any }))} className={inp}>
            <option value="paid">已繳費</option><option value="unpaid">未繳費</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9A8878]">課程類型</label>
          <select value={form.course_type} onChange={(e) => setForm((f) => ({ ...f, course_type: e.target.value as any }))} className={inp}>
            <option value="regular">正式</option><option value="trial">試上</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9A8878]">家長 Email</label>
          <input type="email" value={form.parent_email} onChange={(e) => setForm((f) => ({ ...f, parent_email: e.target.value }))} className={inp} />
        </div>
        {showStartDate && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#9A8878]">起始日期</label>
            <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className={inp} />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-[#EDE5D8] text-[#9A8878] text-sm hover:bg-[#F5F0E8] transition-colors">取消</button>
        <button onClick={onSave} disabled={loading} className="btn-gold px-5 py-2 text-sm">{loading ? "儲存中…" : "儲存"}</button>
      </div>
    </div>
  );
}
