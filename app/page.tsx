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

  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const last7 = getLast7Days();

  function buildCardData(student: any) {
    const sa = (allAttendance ?? []).filter((a: any) => a.student_id === student.id);
    const attendanceDates = sa.map((a: any) => a.attended_date).sort((a: string, b: string) => b.localeCompare(a));
    const attended = sa.length;
    const total = student.sessions?.[0]?.total_classes ?? 10;
    const checkedInToday = attendanceDates.includes(today);
    const todayRecord: any = sa.find((a: any) => a.attended_date === today);
    const substituteToday: string | null = todayRecord?.substitute_name ?? null;
    const paymentClaimedToday: boolean = todayRecord?.payment_claimed ?? false;
    const missedDates = last7.filter((d) => {
      const day = new Date(d).getDay();
      const dow = day === 6 ? "sat" : day === 0 ? "sun" : null;
      return dow === student.day_of_week && !attendanceDates.includes(d);
    });
    return { ...student, attended, total, checkedInToday, substituteToday, paymentClaimedToday, attendanceDates, missedDates };
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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Notice banners */}
        {(notices ?? []).length > 0 && (
          <div className="space-y-3">
            {(notices ?? []).map((n: any) => (
              <div key={n.id} className="bg-[#FFF8E7] border border-[#F5C842] rounded-2xl px-5 py-4 flex gap-3 items-start shadow-sm">
                <span className="text-xl shrink-0 mt-0.5">📢</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#7A5200] text-sm">{n.title}</p>
                  <p className="text-sm text-[#8A6200] mt-0.5 whitespace-pre-line">{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

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
