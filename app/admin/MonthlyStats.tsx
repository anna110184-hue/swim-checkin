"use client";

import { useState } from "react";
import { Student, Attendance } from "@/lib/supabase/types";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface Props {
  students: Student[];
  attendance: Attendance[];
}

export default function MonthlyStats({ students, attendance }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dayTab, setDayTab] = useState<"sat" | "sun">("sat");

  const start = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
  const end = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");

  function countFor(studentId: string) {
    return attendance.filter(
      (a) => a.student_id === studentId && !a.is_cancelled && a.attended_date >= start && a.attended_date <= end
    ).length;
  }

  const satStudents = students.filter((s) => s.day_of_week === "sat");
  const sunStudents = students.filter((s) => s.day_of_week === "sun");
  const displayed = dayTab === "sat" ? satStudents : sunStudents;
  const totalThisMonth = displayed.reduce((sum, s) => sum + countFor(s.id), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#2C2017]">月度統計</h2>
          <p className="text-sm text-[#9A8878] mt-0.5">本月合計 {totalThisMonth} 堂</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border border-[#EDE5D8] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40">
            {[2025, 2026].map((y) => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-[#EDE5D8] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2">
        {(["sat", "sun"] as const).map((d) => {
          const active = dayTab === d;
          return (
            <button key={d} onClick={() => setDayTab(d)}
              className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${active ? "bg-[#A67C52] text-white" : "bg-white text-[#9A8878] border border-[#EDE5D8]"}`}>
              {d === "sat" ? "週六" : "週日"}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F0E8] text-[#9A8878] text-xs font-semibold tracking-wide">
              <th className="text-left px-5 py-3.5">#</th>
              <th className="text-left px-5 py-3.5">學生</th>
              <th className="text-left px-5 py-3.5">家長</th>
              <th className="text-left px-5 py-3.5">時段</th>
              <th className="text-right px-5 py-3.5">本月出席</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {displayed.map((s, i) => {
              const count = countFor(s.id);
              return (
                <tr key={s.id} className="hover:bg-[#FBF8F3] transition-colors">
                  <td className="px-5 py-4 text-[#A67C52] font-bold">{i + 1}</td>
                  <td className="px-5 py-4 font-bold text-[#2C2017]">{s.name}</td>
                  <td className="px-5 py-4 text-[#9A8878]">{s.parent_name}</td>
                  <td className="px-5 py-4 text-[#9A8878]">{s.time_slot}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-2xl font-black ${count === 0 ? "text-[#D4C8B8]" : "text-[#A67C52]"}`}>
                      {count}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
