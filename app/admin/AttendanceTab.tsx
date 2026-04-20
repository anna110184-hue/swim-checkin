"use client";

import { useState } from "react";
import { Student, Session, Attendance } from "@/lib/supabase/types";

interface Props {
  students: Student[];
  attendance: Attendance[];
  sessions: Session[];
}

export default function AttendanceTab({ students, attendance, sessions }: Props) {
  const [filterStudent, setFilterStudent] = useState("all");
  const [makeupStudentId, setMakeupStudentId] = useState("");
  const [makeupDate, setMakeupDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const filtered = attendance.filter(
    (a) => filterStudent === "all" || a.student_id === filterStudent
  );

  function getStudentName(id: string) {
    const s = students.find((s) => s.id === id);
    return s ? `${s.name}（${s.parent_name}）` : id;
  }

  async function handleAdminMakeup() {
    if (!makeupStudentId || !makeupDate) return;
    setLoading(true);
    const res = await fetch("/api/admin/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: makeupStudentId, date: makeupDate, is_makeup: true }),
    });
    if (res.ok) {
      const s = students.find((s) => s.id === makeupStudentId);
      setSuccessMsg(`已為 ${s?.name} 補打 ${makeupDate}`);
      setMakeupStudentId(""); setMakeupDate("");
    }
    setLoading(false);
  }

  const inp = "border border-[#EDE5D8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40 bg-[#FBF8F3]";

  return (
    <div className="space-y-5">
      {/* Admin makeup card */}
      <div className="bg-white rounded-2xl border border-[#EDE5D8] p-5 space-y-3">
        <p className="font-bold text-[#2C2017]">代補打卡（管理員）</p>
        {successMsg && (
          <div className="bg-[#E8F5E9] text-[#4CAF50] text-sm px-4 py-2.5 rounded-xl border border-[#C8E6C9]">
            ✓ {successMsg}
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          <select value={makeupStudentId} onChange={(e) => setMakeupStudentId(e.target.value)} className={inp}>
            <option value="">選擇學生</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}（{s.day_of_week === "sat" ? "週六" : "週日"}）</option>
            ))}
          </select>
          <input type="date" value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} className={inp} />
          <button onClick={handleAdminMakeup} disabled={loading || !makeupStudentId || !makeupDate} className="btn-gold px-5 py-2 text-sm">
            {loading ? "補打中…" : "補打卡"}
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#9A8878]">篩選：</span>
        <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className={inp}>
          <option value="all">全部學生</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="text-sm text-[#9A8878] ml-auto">{filtered.length} 筆</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F0E8] text-[#9A8878] text-xs font-semibold tracking-wide">
              <th className="text-left px-5 py-3.5">學生</th>
              <th className="text-left px-5 py-3.5">日期</th>
              <th className="text-left px-5 py-3.5">類型</th>
              <th className="text-left px-5 py-3.5">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[#9A8878]">尚無紀錄</td></tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="hover:bg-[#FBF8F3] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#2C2017]">{getStudentName(a.student_id)}</td>
                  <td className="px-5 py-3.5 text-[#9A8878]">{a.attended_date}</td>
                  <td className="px-5 py-3.5">
                    {a.is_makeup
                      ? <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EEF2FF] text-[#7986CB] border border-[#C5CAE9]">補打</span>
                      : <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FBF8F3] text-[#A67C52] border border-[#EDE5D8]">正常</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {a.is_cancelled
                      ? <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFF0F0] text-[#E57373] border border-[#FFCDD2]">已取消</span>
                      : <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E8F5E9] text-[#4CAF50] border border-[#C8E6C9]">有效</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
