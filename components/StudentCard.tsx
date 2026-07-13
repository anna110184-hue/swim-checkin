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
  substituteToday: string | null;
  paymentClaimedToday: boolean;
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
  substituteToday,
  paymentClaimedToday,
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
  const [showSubstitute, setShowSubstitute] = useState(false);
  const [substituteInput, setSubstituteInput] = useState("");
  const [substituteName, setSubstituteName] = useState<string | null>(substituteToday);
  const [paymentClaimed, setPaymentClaimed] = useState(paymentClaimedToday);

  async function handleCheckin() {
    setLoading(true);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id }),
    });
    if (res.ok) {
      setChecked(true);
      setCount((c) => c + 1);
      // Auto-mark payment claimed for regular check-in
      await fetch("/api/payment-claimed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: student.id, date: today }),
      });
      setPaymentClaimed(true);
    }
    setLoading(false);
  }

  async function handleCancel() {
    setLoading(true);
    const res = await fetch("/api/cancel-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id }),
    });
    if (res.ok) {
      setChecked(false);
      setCount((c) => Math.max(0, c - 1));
      setSubstituteName(null);
      setPaymentClaimed(false);
    }
    setLoading(false);
  }

  async function handleSubstitute() {
    const name = substituteInput.trim();
    if (!name) return;
    setLoading(true);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id, substitute_name: name }),
    });
    if (res.ok) {
      setChecked(true);
      setCount((c) => c + 1);
      setSubstituteName(name);
      setShowSubstitute(false);
      setSubstituteInput("");
    }
    setLoading(false);
  }

  async function handlePaymentClaim() {
    setLoading(true);
    const res = await fetch("/api/payment-claimed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: student.id, date: today }),
    });
    if (res.ok) { setPaymentClaimed(true); }
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

        {/* Substitute badge */}
        {checked && substituteName && (
          <div className="bg-[#EEF2FF] text-[#7986CB] text-sm font-medium px-4 py-2.5 rounded-2xl border border-[#C5CAE9]">
            本週由 {substituteName} 代上 ✓
          </div>
        )}

        {/* Check-in */}
        <div className="flex gap-2">
          <button onClick={handleCheckin} disabled={loading || checked} className="btn-gold flex-1 py-3 text-base">
            {loading ? "處理中…" : checked ? "✓ 已打卡" : "◎ 打卡"}
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

        {/* Payment section — appears after check-in */}
        {checked && (
          <div className="bg-[#FFFBF5] rounded-2xl p-4 border border-[#EDE5D8]">
            {/* Regular check-in: auto confirmed; Substitute: needs manual click */}
            {!substituteName || paymentClaimed ? (
              <div className="flex items-center gap-1.5 text-xs text-[#4CAF50] font-semibold">
                ✓ 已通知轉帳
              </div>
            ) : (
              <button
                onClick={handlePaymentClaim}
                disabled={loading}
                className="btn-gold text-xs py-1.5 px-4"
              >
                {loading ? "處理中…" : "我已轉帳 ✓"}
              </button>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex gap-4 text-xs text-[#A67C52]">
          {!checked && (
            <button onClick={() => setShowSubstitute(!showSubstitute)} className="hover:underline">
              找人代上
            </button>
          )}
          {availableMakeups.length > 0 && (
            <button onClick={() => setShowMakeup(!showMakeup)} className="hover:underline">
              補打卡（{availableMakeups.length}）
            </button>
          )}
          <button onClick={() => setShowHistory(!showHistory)} className="hover:underline ml-auto">
            出席紀錄
          </button>
        </div>

        {/* Substitute panel */}
        {showSubstitute && !checked && (
          <div className="bg-[#FBF8F3] rounded-2xl p-3 space-y-2 border border-[#EDE5D8]">
            <p className="text-xs font-semibold text-[#A67C52]">本週無法上課？填代課者名字（課照扣、費用照繳）</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={substituteInput}
                onChange={(e) => setSubstituteInput(e.target.value)}
                placeholder="代課者名字"
                maxLength={50}
                className="flex-1 min-w-0 border border-[#EDE5D8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40 bg-white"
              />
              <button
                onClick={handleSubstitute}
                disabled={loading || substituteInput.trim() === ""}
                className="btn-gold text-xs py-1 px-3 shrink-0 disabled:opacity-50"
              >
                {loading ? "處理中…" : "確認代上"}
              </button>
            </div>
          </div>
        )}

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
