import { createClient } from "@/lib/supabase/server";
import { getTodayString, getTodayDayOfWeek, getLast7Days } from "@/lib/utils";
import HomeClient from "@/components/HomeClient";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();
  const today = getTodayString();
  const todayDow = getTodayDayOfWeek();

  const { data: students } = await supabase
    .from("students")
    .select("*, sessions(id, total_classes, start_date)")
    .order("time_slot");

  const { data: allAttendance } = await supabase
    .from("attendance")
    .select("*")
    .eq("is_cancelled", false);

  const last7 = getLast7Days();

  function buildCardData(student: any) {
    const sa = (allAttendance ?? []).filter((a: any) => a.student_id === student.id);
    const attendanceDates = sa.map((a: any) => a.attended_date).sort((a: string, b: string) => b.localeCompare(a));
    const attended = sa.length;
    const total = student.sessions?.[0]?.total_classes ?? 10;
    const checkedInToday = attendanceDates.includes(today);
    const missedDates = last7.filter((d) => {
      const day = new Date(d).getDay();
      const dow = day === 6 ? "sat" : day === 0 ? "sun" : null;
      return dow === student.day_of_week && !attendanceDates.includes(d);
    });
    return { ...student, attended, total, checkedInToday, attendanceDates, missedDates };
  }

  const satStudents = (students ?? []).filter((s: any) => s.day_of_week === "sat").map(buildCardData);
  const sunStudents = (students ?? []).filter((s: any) => s.day_of_week === "sun").map(buildCardData);
  const defaultTab = todayDow === "sun" ? "sun" : "sat";

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Top bar */}
      <header className="bg-[#F5F0E8] px-6 pt-8 pb-4 max-w-7xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#2C2017] tracking-tight">課程打卡系統</h1>
          <p className="text-sm font-medium text-[#A67C52] tracking-[0.3em] mt-1">ATTENDANCE · RECORD</p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <a href="/admin/stats" className="btn-outline">月度統計</a>
          <a href="/admin" className="btn-outline">管理後台</a>
        </div>
      </header>

      <div className="h-px bg-[#D4C8B8] mx-6 max-w-7xl mx-auto" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <HomeClient
          satStudents={satStudents}
          sunStudents={sunStudents}
          today={today}
          defaultTab={defaultTab}
        />
      </main>
    </div>
  );
}
