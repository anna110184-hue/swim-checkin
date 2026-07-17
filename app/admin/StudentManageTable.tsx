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
  const [totalMap, setTotalMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(sessions.map((s) => [s.student_id, s.total_classes]))
  );
  const [paidMap, setPaidMap] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(sessions.map((s) => [s.student_id, s.paid_lessons ?? null]))
  );
  const [editingTotal, setEditingTotal] = useState<string | null>(null);
  const [totalInput, setTotalInput] = useState("");
  const [editingPaid, setEditingPaid] = useState<string | null>(null);
  const [paidInput, setPaidInput] = useState("");

  function getAttendedCount(studentId: string) {
    return attendance.filter((a) => a.student_id === studentId && !a.is_cancelled).length;
  }

  async function saveTotal(studentId: string) {
    const val = parseInt(totalInput);
    if (isNaN(val) || val < 1 || val > 99) return;
    await fetch("/api/admin/update-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, total_classes: val }),
    });
    setTotalMap((prev) => ({ ...prev, [studentId]: val }));
    setEditingTotal(null);
  }

  async function savePaid(studentId: string) {
    const trimmed = paidInput.trim();
    const val = trimmed === "" || trimmed === "0" ? null : parseInt(trimmed);
    if (val !== null && (isNaN(val) || val < 1 || val > 99)) return;
    await fetch("/api/admin/update-sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, paid_lessons: val }),
    });
    setPaidMap((prev) => ({ ...prev, [studentId]: val }));
    setEditingPaid(null);
  }

  function startEdit(student: Student) {
    setEditId(student.id);
    setForm({ name: student.name, parent_name: student.parent_name, time_slot: student.time_slot, day_of_week: student.day_of_week, payment_status: student.payment_status, course_type: student.course_type, parent_email: student.parent_email ?? "", start_date: "" });
    setShowAdd(false);
  }

  async function saveEdit() {
    if (!editId) return;
    setLoading(true);
    const { start_date, ...editFields } = form;
    const res = await fetch("/api/admin/students", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...editFields }) });
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

  async function handleReceipt(student: Student) {
    setLoading(true);
    const total = totalMap[student.id] ?? 10;
    const res = await fetch("/api/admin/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id, lessons: total }),
    });
    if (res.ok) {
      const { path, receipt_no } = await res.json();
      const url = `${window.location.origin}${path}`;
      try {
        await navigator.clipboard.writeText(url);
        alert(`已開立收據 ${receipt_no}，專屬連結已複製，直接貼給家長即可：\n${url}`);
      } catch {
        alert(`已開立收據 ${receipt_no}：\n${url}`);
      }
    } else {
      alert("開立收據失敗，請稍後再試");
    }
    setLoading(false);
  }

  async function handleReset(id: string, name: string) {
    if (!confirm(`確定要將「${name}」的出席紀錄歸零？此操作無法復原。`)) return;
    setLoading(true);
    await fetch("/api/admin/reset-attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: id }) });
    setLoading(false);
    window.location.reload();
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
              const total = totalMap[student.id] ?? 10;
              const pct = Math.round((count / total) * 100);
              if (editId === student.id) {
                return (
                  <tr key={student.id}>
                    <td colSpan={6} className="px-5 py-4">
                      <EditForm form={form} setForm={setForm} onSave={saveEdit} onCancel={() => setEditId(null)} loading={loading} />
                    </td>
                  </tr>
                );
              }
              {(() => {
                const paid = paidMap[student.id] ?? null;
                const overdue = paid !== null && count >= paid;
                const warning = paid !== null && !overdue && count === paid - 1;
                return (
                <tr key={student.id} className={`transition-colors ${overdue ? "bg-[#FFF5F5]" : warning ? "bg-[#FFFBF0]" : "hover:bg-[#FBF8F3]"}`}>
                  <td className="px-5 py-4 text-[#A67C52] font-bold">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#2C2017]">{student.name}
                      <span className="text-[#9A8878] font-normal ml-1">({student.parent_name})</span>
                    </p>
                    {overdue && <span className="inline-block mt-1 text-[10px] font-bold bg-[#FFEBEE] text-[#E53935] px-2 py-0.5 rounded-full">🚨 已超出繳費堂數</span>}
                    {warning && <span className="inline-block mt-1 text-[10px] font-bold bg-[#FFF3E0] text-[#E65100] px-2 py-0.5 rounded-full">⚠️ 剩1堂，請通知繳費</span>}
                  </td>
                  <td className="px-5 py-4 text-[#9A8878]">{student.time_slot}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-2 min-w-[160px]">
                      {/* Total classes row */}
                      <div className="flex justify-between items-center text-xs text-[#9A8878]">
                        <span>上課 {count} / {total} 堂</span>
                        <div className="flex items-center gap-1">
                          <span>{pct}%</span>
                          {editingTotal === student.id ? (
                            <div className="flex items-center gap-1 ml-1">
                              <input type="number" value={totalInput} onChange={(e) => setTotalInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveTotal(student.id); if (e.key === "Escape") setEditingTotal(null); }}
                                className="w-12 border border-[#A67C52] rounded-lg px-1.5 py-0.5 text-xs text-center focus:outline-none"
                                min={1} max={99} autoFocus />
                              <button onClick={() => saveTotal(student.id)} className="text-[#A67C52] text-xs font-bold">✓</button>
                              <button onClick={() => setEditingTotal(null)} className="text-[#9A8878] text-xs">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingTotal(student.id); setTotalInput(String(total)); setEditingPaid(null); }}
                              className="ml-1 text-[#9A8878] hover:text-[#A67C52]" title="調整總堂數">✎</button>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-[#EDE5D8] rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-[#A67C52] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      {/* Paid lessons row */}
                      <div className={`flex items-center justify-between text-xs rounded-lg px-2 py-1 ${overdue ? "bg-[#FFEBEE]" : warning ? "bg-[#FFF3E0]" : "bg-[#F5F0E8]"}`}>
                        <span className={overdue ? "text-[#E53935] font-semibold" : warning ? "text-[#E65100] font-semibold" : "text-[#9A8878]"}>
                          已繳：{paid !== null ? `${paid} 堂` : "—"}
                        </span>
                        {editingPaid === student.id ? (
                          <div className="flex items-center gap-1">
                            <input type="number" value={paidInput} onChange={(e) => setPaidInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") savePaid(student.id); if (e.key === "Escape") setEditingPaid(null); }}
                              placeholder="堂數"
                              className="w-12 border border-[#A67C52] rounded-lg px-1.5 py-0.5 text-xs text-center focus:outline-none"
                              min={0} max={99} autoFocus />
                            <button onClick={() => savePaid(student.id)} className="text-[#A67C52] text-xs font-bold">✓</button>
                            <button onClick={() => setEditingPaid(null)} className="text-[#9A8878] text-xs">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingPaid(student.id); setPaidInput(paid !== null ? String(paid) : ""); setEditingTotal(null); }}
                            className="text-[#9A8878] hover:text-[#A67C52] text-xs" title="設定已繳堂數">✎</button>
                        )}
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
                      <button onClick={() => handleReceipt(student)} disabled={loading} className="text-xs text-[#4CAF50] hover:underline font-medium">收據</button>
                      <button onClick={() => startEdit(student)} className="text-xs text-[#A67C52] hover:underline font-medium">編輯</button>
                      <button onClick={() => handleReset(student.id, student.name)} className="text-xs text-orange-400 hover:underline font-medium">歸零</button>
                      <button onClick={() => handleDelete(student.id)} className="text-xs text-[#E57373] hover:underline font-medium">刪除</button>
                    </div>
                  </td>
                </tr>
              );
              })()}
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
