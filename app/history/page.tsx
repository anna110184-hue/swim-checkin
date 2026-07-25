import { createServiceClient } from "@/lib/supabase/server";
import { format, subDays, parseISO } from "date-fns";
import Link from "next/link";

export const revalidate = 0;

function saturdayToWeekStart(satDate: string): string {
  const d = parseISO(satDate);
  return format(subDays(d, 5), "yyyy-MM-dd");
}

function formatSatDate(satDate: string): string {
  const d = parseISO(satDate);
  return format(d, "MM/dd");
}

export default async function HistoryPage() {
  const supabase = createServiceClient();

  const { data: attendance } = await supabase
    .from("attendance")
    .select("attended_date")
    .eq("is_cancelled", false);

  const satDates = Array.from(
    new Set(
      (attendance ?? [])
        .map((a: any) => a.attended_date)
        .filter((d: string) => new Date(d).getDay() === 6)
    )
  ).sort((a: string, b: string) => b.localeCompare(a));

  type WeekEntry = { sat: string; weekStart: string; count: number };
  const weekMap: Record<string, WeekEntry> = {};

  for (const row of attendance ?? []) {
    const d = new Date(row.attended_date);
    if (d.getDay() !== 6) continue;
    const key = row.attended_date;
    if (!weekMap[key]) {
      weekMap[key] = { sat: key, weekStart: saturdayToWeekStart(key), count: 0 };
    }
    weekMap[key].count++;
  }

  const weeks: WeekEntry[] = Object.values(weekMap).sort((a, b) =>
    b.sat.localeCompare(a.sat)
  );

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#F5F0E8] px-6 pt-8 pb-4 max-w-2xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#2C2017] tracking-tight">歷史週報</h1>
          <p className="text-sm font-medium text-[#A67C52] tracking-[0.2em] mt-0.5">REPORT HISTORY</p>
        </div>
        <Link href="/" className="btn-outline text-sm mt-2">← 返回首頁</Link>
      </header>

      <div className="h-px bg-[#D4C8B8] mx-6" />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {weeks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-10 text-center text-[#9A8878]">
            尚無出席紀錄
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#EDE5D8] overflow-hidden shadow-sm">
            <ul className="divide-y divide-[#F5F0E8]">
              {weeks.map((w) => (
                <li key={w.sat}>
                  <Link
                    href={`/weekly-report/${w.weekStart}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#FBF8F3] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-[#A67C52]">
                        {formatSatDate(w.sat)}
                      </span>
                      <span className="text-sm font-semibold text-[#9A8878]">週六</span>
                      <span className="text-xs bg-[#A67C52]/10 text-[#A67C52] px-2.5 py-0.5 rounded-full font-medium">
                        出席 {w.count} 位
                      </span>
                    </div>
                    <span className="text-[#D4C8B8] group-hover:text-[#A67C52] transition-colors text-lg">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
