"use client";

import { useState } from "react";
import Link from "next/link";
import { Student, Session, Attendance } from "@/lib/supabase/types";
import StudentManageTable from "./StudentManageTable";
import AttendanceTab from "./AttendanceTab";
import NoticesTab from "./NoticesTab";
import PageSettingsTab from "./PageSettingsTab";
import { Notice } from "@/lib/supabase/types";

type Tab = "students" | "attendance" | "notices" | "settings";

interface Props {
  initialStudents: Student[];
  initialAttendance: Attendance[];
  initialSessions: Session[];
  initialNotices: Notice[];
  initialShowSat: boolean;
  initialShowSun: boolean;
}

export default function AdminDashboard({ initialStudents, initialAttendance, initialSessions, initialNotices, initialShowSat, initialShowSun }: Props) {
  const [tab, setTab] = useState<Tab>("students");
  const [students, setStudents] = useState(initialStudents);

  const totalCheckins = initialAttendance.filter((a) => !a.is_cancelled).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "students", label: "課程管理" },
    { key: "attendance", label: "打卡紀錄" },
    { key: "notices", label: "重要通知" },
    { key: "settings", label: "頁面設定" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats banner */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="bg-white rounded-2xl border-l-4 border-[#A67C52] px-6 py-4 shadow-sm border border-[#EDE5D8] flex-1">
          <p className="text-2xl font-black text-[#2C2017]">
            累計打卡次數：<span className="text-[#A67C52]">{totalCheckins} 次</span>
          </p>
          <p className="text-sm text-[#9A8878] mt-0.5">所有學生合計已上課堂數</p>
        </div>
        <Link
          href="/admin/weekly-report"
          className="btn-gold px-6 py-3 text-sm font-bold shrink-0"
        >
          📋 週報
        </Link>
      </div>

      {/* Underline tabs */}
      <div className="flex gap-8 border-b border-[#D4C8B8]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              tab === t.key
                ? "text-[#A67C52]"
                : "text-[#9A8878] hover:text-[#A67C52]"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A67C52] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === "students" && (
        <StudentManageTable
          students={students}
          sessions={initialSessions}
          attendance={initialAttendance}
          onStudentsChange={setStudents}
        />
      )}
      {tab === "attendance" && (
        <AttendanceTab
          students={students}
          attendance={initialAttendance}
          sessions={initialSessions}
        />
      )}
      {tab === "notices" && (
        <NoticesTab initialNotices={initialNotices} />
      )}
      {tab === "settings" && (
        <PageSettingsTab initialShowSat={initialShowSat} initialShowSun={initialShowSun} />
      )}
    </div>
  );
}
