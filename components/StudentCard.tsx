"use client";

import { useState } from "react";
import ProgressDots from "./ProgressDots";
import { formatDisplayDate } from "@/lib/utils";

const CIRCLE_NUMBERS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱"];

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    parent_name: string;
    time_slot: string;
    payment_status: "paid" | "unpaid";
    course_type: "regular" | "trial";
  };
  index: number;
  attended: number;
  total: number;
  checkedInToday: boolean;
  attendanceDates: string[];
  missedDates: string[];
  today: string;
}

export default function StudentCard({
  student,
  index,
  attended,
  total,
  checkedInToday,
  attendanceDates,
  missedDates,
  today,
}: StudentCardProps) {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(checkedInToday);
  const [count, setCount] = useState(attended);
  const [showHistory, setShowHistory] = useState(false);
  const [showMakeup, setShowMakeup] = useState(false);
  const [makeupDone, setMakeupDone] = useState<string[]>([]);

  async function handleCheckin() {
    setLoading(true);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id }),
    });
    if (res.ok) { setChecked(true); setCount((c) => c + 1); }
    setLoading(false);
  }

  async function handleCancel() {
    setLoading(true);
    const res = await fetch("/api/cancel-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id }),
    });
    if (res.ok) { setChecked(false); setCount((c) => Math.max(0, c - 1)); }
    setLoading(false);
  }

  async function handleMakeup(date: string) {
    setLoading(true);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id, date }),
    });
    if (res.ok) { setMakeupDone((p) => [...p, date]); setCount((c) => c + 1); }
    setLoading(false);
  }

  const availableMakeups = missedDates.filter((d) => !makeupDone.includes(d));

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-[#EDE5D8]">
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <span className="text-[#A67C52] text-2xl font-bold leading-none mt-0.5 shrink-0">
            {CIRCLE_NUMBERS[index] ?? `${index + 1}`}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-[#2C2017] leading-tight">
                  {student.name}
                  <span className="text-[#9A8878] font-normal text-base ml-1">
                    ({student.parent_name})
                  </span>
                </h2>
                <p className="text-sm text-[#9A8878] mt-0.5">{student.time_slot}</p>
              </div>
              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                <span className={student.payment_status === "paid" ? "badge-paid" : "badge-unpaid"}>
                  {student.payment_status === "paid" ? "已繳費" : "未繳費"}
                </span>
                <span className={student.course_type === "regular" ? "badge-regular" : "badge-trial"}>
                  {student.course_type === "regular" ? "正式" : "試上"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <ProgressDots attended={count} total={total} />

        {/* Check-in */}
        <div className="flex gap-2">
          <button onClick={handleCheckin} disabled={loading} className="btn-gold flex-1 py-3 text-base">
            {loading ? "處理中…" : "◎ 打卡"}
          </button>
          {checked && (
            <button
              onClick={handleCancel}
              disabled={loading}
              title="撤銷打卡"
              className="w-12 h-12 rounded-2xl border border-[#EDE5D8] text-[#9A8878] hover:bg-[#FFF0F0] hover:text-[#E57373] hover:border-[#FFCDD2] transition-colors flex items-center justify-center text-lg"
            >
              ↩
            </button>
          )}
        </div>

        {/* Links */}
        <div className="flex gap-4 text-xs text-[#A67C52]">
          {availableMakeups.length > 0 && (
            <button onClick={() => setShowMakeup(!showMakeup)} className="hover:underline">
              補打卡（{availableMakeups.length}）
            </button>
          )}
          <button onClick={() => setShowHistory(!showHistory)} className="hover:underline ml-auto">
            出席紀錄
          </button>
        </div>

        {/* Makeup panel */}
        {showMakeup && availableMakeups.length > 0 && (
          <div className="bg-[#FBF8F3] rounded-2xl p-3 space-y-2 border border-[#EDE5D8]">
            <p className="text-xs font-semibold text-[#A67C52]">補打卡（7天內）</p>
            {availableMakeups.map((d) => (
              <div key={d} className="flex items-center justify-between">
                <span className="text-sm text-[#2C2017]">{formatDisplayDate(d)}</span>
                <button onClick={() => handleMakeup(d)} disabled={loading} className="btn-gold text-xs py-1 px-3">
                  補打
                </button>
              </div>
            ))}
          </div>
        )}

        {/* History panel */}
        {showHistory && (
          <div className="bg-[#FBF8F3] rounded-2xl p-3 space-y-2 border border-[#EDE5D8]">
            <p className="text-xs font-semibold text-[#9A8878]">歷史出席紀錄</p>
            {attendanceDates.length === 0 ? (
              <p className="text-xs text-[#9A8878]">尚無紀錄</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {attendanceDates.map((d) => (
                  <span key={d} className="text-xs bg-[#A67C52]/10 text-[#A67C52] px-2.5 py-0.5 rounded-full font-medium">
                    {formatDisplayDate(d)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
