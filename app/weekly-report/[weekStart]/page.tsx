import { createServiceClient } from "@/lib/supabase/server";
import { formatDisplayDate } from "@/lib/utils";
import { format, addDays, parseISO, isValid } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function ParentWeeklyReportPage({
  params,
}: {
  params: { weekStart: string };
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.weekStart)) notFound();

  const startDate = parseISO(params.weekStart);
  if (!isValid(startDate)) notFound();

  const start = params.weekStart;
  const end = format(addDays(startDate, 6), "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, i) =>
    format(addDays(startDate, i), "yyyy-MM-dd")
  );
  const satDays = days.filter((d) => new Date(d).getDay() === 6);

  const supabase = createServiceClient();
  const [{ data: students }, { data: attendance }, { data: payout }] =
    await Promise.all([
      supabase.from("students").select("*").order("time_slot"),
      supabase
        .from("attendance")
        .select("*")
        .gte("attended_date", start)
        .lte("attended_date", end)
        .eq("is_cancelled", false),
      supabase
        .from("weekly_payouts")
        .select("*")
        .eq("week_start", start)
        .maybeSingle(),
    ]);

  const studentList = (students ?? []).filter((s: any) => s.day_of_week === "sat");
  const attendanceList = attendance ?? [];

  const attended = studentList
    .map((s: any) => {
      const records = attendanceList.filter((a: any) => a.student_id === s.id);
      return { ...s, records, attended: records.length > 0 };
    })
    .filter((s: any) => s.attended);

  const absent = studentList
    .map((s: any) => {
      const records = attendanceList.filter((a: any) => a.student_id === s.id);
      return { ...s, records, attended: records.length > 0 };
    })
    .filter((s: any) => !s.attended);

  const satLabel = satDays.length > 0 ? formatDisplayDate(satDays[0]) : "";

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#F5F0E8] px-6 pt-8 pb-4 max-w-2xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#2C2017] tracking-tight">出席週報</h1>
          <p className="text-sm font-medium text-[#A67C52] tracking-[0.2em] mt-0.5">
            {satLabel} 週六
          </p>
        </div>
        <Link href="/history" className="btn-outline text-sm mt-2">← 歷史週報</Link>
      </header>

      <div className="h-px bg-[#D4C8B8] mx-6" />

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-4 text-center">
            <p className="text-xs text-[#9A8878] font-semibold">本週出席</p>
            <p className="text-2xl font-black text-[#A67C52] mt-1">{attended.length} 位</p>
            <p className="text-xs text-[#9A8878] mt-0.5">共 {studentList.length} 位</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-4 text-center">
            <p className="text-xs text-[#9A8878] font-semibold">本週缺席</p>
            <p className="text-2xl font-black text-[#2C2017] mt-1">{absent.length} 位</p>
            <p className="text-xs text-[#9A8878] mt-0.5">&nbsp;</p>
          </div>
        </div>

        {/* Attended */}
        {attended.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
            <div className="bg-[#E8F5E9] px-5 py-2.5 border-b border-[#C8E6C9]">
              <p className="text-xs font-bold text-[#388E3C]">✓ 已出席（{attended.length} 位）</p>
            </div>
            <ul className="divide-y divide-[#F5F0E8]">
              {attended.map((s: any) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                  <span className="font-semibold text-[#2C2017] text-sm">{s.name}</span>
                  <span className="text-xs text-[#9A8878]">{s.time_slot}</span>
                  {s.records.map((r: any) => (
                    <span
                      key={r.attended_date}
                      className="text-xs bg-[#A67C52]/10 text-[#A67C52] px-2 py-0.5 rounded-full font-medium"
                    >
                      {formatDisplayDate(r.attended_date)}
                      {r.substitute_name ? ` (${r.substitute_name}代)` : ""}
                      {r.is_makeup ? " 補" : ""}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Absent */}
        {absent.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
            <div className="bg-[#FBF8F3] px-5 py-2.5 border-b border-[#EDE5D8]">
              <p className="text-xs font-bold text-[#9A8878]">本週缺席（{absent.length} 位）</p>
            </div>
            <ul className="divide-y divide-[#F5F0E8]">
              {absent.map((s: any) => (
                <li key={s.id} className="flex items-center px-5 py-3 gap-2">
                  <span className="text-sm text-[#9A8878]">{s.name}</span>
                  <span className="text-xs text-[#9A8878]">{s.time_slot}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payment screenshot */}
        {(payout as any)?.screenshot_url && (
          <div className="space-y-3">
            <div className="section-divider">匯款截圖</div>
            <div className="bg-white rounded-2xl border border-[#EDE5D8] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(payout as any).screenshot_url}
                alt="匯款截圖"
                className="w-full max-h-[480px] object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
