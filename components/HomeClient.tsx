"use client";

import { useState } from "react";
import StudentCard from "./StudentCard";

interface StudentData {
  id: string;
  name: string;
  parent_name: string;
  time_slot: string;
  day_of_week: "sat" | "sun";
  payment_status: "paid" | "unpaid";
  course_type: "regular" | "trial";
  attended: number;
  total: number;
  checkedInToday: boolean;
  attendanceDates: string[];
  missedDates: string[];
}

interface Props {
  satStudents: StudentData[];
  sunStudents: StudentData[];
  today: string;
  defaultTab: "sat" | "sun";
}

export default function HomeClient({ satStudents, sunStudents, today, defaultTab }: Props) {
  const [tab, setTab] = useState<"sat" | "sun">(defaultTab);
  const students = tab === "sat" ? satStudents : sunStudents;

  const paidCount = students.filter((s) => s.payment_status === "paid").length;
  const unpaidCount = students.filter((s) => s.payment_status === "unpaid").length;
  const sectionLabel = tab === "sat" ? "SATURDAY SCHEDULE" : "SUNDAY SCHEDULE";

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {(["sat", "sun"] as const).map((t) => {
          const count = t === "sat" ? satStudents.length : sunStudents.length;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                active
                  ? "bg-[#A67C52] text-white shadow-sm"
                  : "bg-white text-[#9A8878] border border-[#EDE5D8] hover:border-[#A67C52]/40"
              }`}
            >
              {t === "sat" ? "週六" : "週日"}
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-[#EDE5D8] text-[#9A8878]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section divider */}
      <div className="section-divider">{sectionLabel}</div>

      {/* Stats */}
      <p className="text-sm text-[#9A8878]">
        共 {students.length} 位學生・已繳費 {paidCount} 位・未繳費 {unpaidCount} 位
      </p>

      {/* Grid */}
      {students.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center text-[#9A8878] border border-[#EDE5D8]">
          尚無學生資料
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s, i) => (
            <StudentCard
              key={s.id}
              student={s}
              index={i}
              today={today}
              attended={s.attended}
              total={s.total}
              checkedInToday={s.checkedInToday}
              attendanceDates={s.attendanceDates}
              missedDates={s.missedDates}
            />
          ))}
        </div>
      )}
    </div>
  );
}
