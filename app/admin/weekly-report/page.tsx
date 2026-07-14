import { createServiceClient } from "@/lib/supabase/server";
import { getThisWeekRange, formatDisplayDate } from "@/lib/utils";
import Link from "next/link";
import PrintButton from "./PrintButton";
import UploadSection from "./UploadSection";

export const revalidate = 0;

const PRICE_PER_LESSON = 45;

export default async function WeeklyReportPage() {
  const supabase = createServiceClient();
  const { start, end, days } = getThisWeekRange();

  const [{ data: students }, { data: attendance }, { data: payout }] = await Promise.all([
    supabase.from("students").select("*").order("day_of_week").order("time_slot"),
    supabase
      .from("attendance")
      .select("*")
      .gte("attended_date", start)
      .lte("attended_date", end),
    supabase.from("weekly_payouts").select("*").eq("week_start", start).maybeSingle(),
  ]);

  const studentList = students ?? [];
  const attendanceList = attendance ?? [];

  type WeekRow = {
    student: typeof studentList[0];
    records: typeof attendanceList;
    totalLessons: number;
    amountDue: number;
    claimed: boolean;
  };

  const rows: WeekRow[] = studentList.map((s) => {
    const records = attendanceList.filter(
      (a) => a.student_id === s.id && !a.is_cancelled
    );
    const totalLessons = records.length;
    const claimed = records.some((a) => a.payment_claimed);
    return { student: s, records, totalLessons, amountDue: totalLessons * PRICE_PER_LESSON, claimed };
  }).filter((r) => r.totalLessons > 0);

  const satRows: WeekRow[] = rows.filter((r) => r.student.day_of_week === "sat");
  const sunRows: WeekRow[] = rows.filter((r) => r.student.day_of_week === "sun");

  const totalLessons = rows.reduce((s, r) => s + r.totalLessons, 0);
  const totalAmount = totalLessons * PRICE_PER_LESSON;
  const claimedCount = rows.filter((r) => r.claimed).length;
  const claimedAmount = rows.filter((r) => r.claimed).reduce((s, r) => s + r.amountDue, 0);

  const satDays = days.filter((d) => new Date(d).getDay() === 6);
  const sunDays = days.filter((d) => new Date(d).getDay() === 0);

  return (
    <div className="min-h-screen bg-[#F5F0E8] print:bg-white print:min-h-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <header className="bg-[#F5F0E8] px-6 pt-8 pb-4 max-w-4xl mx-auto flex items-center justify-between print:bg-white print:pt-0">
        <div>
          <h1 className="text-3xl font-black text-[#2C2017] tracking-tight">週報</h1>
          <p className="text-sm font-medium text-[#A67C52] tracking-[0.2em] mt-0.5">
            {formatDisplayDate(start)} ～ {formatDisplayDate(end)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PrintButton />
          <Link href="/admin" className="btn-outline text-sm print:hidden">← 返回後台</Link>
        </div>
      </header>

      <div className="h-px bg-[#D4C8B8] mx-6" />

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "本週出席", value: `${totalLessons} 堂`, sub: `共 ${rows.length} 位` },
            { label: "應收總額", value: `$${totalAmount}`, sub: "每堂 $45" },
            { label: "已通知轉帳", value: `${claimedCount} 位`, sub: `$${claimedAmount}` },
            { label: "待轉帳", value: `${rows.length - claimedCount} 位`, sub: `$${totalAmount - claimedAmount}` },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-[#EDE5D8] p-4">
              <p className="text-xs text-[#9A8878] font-semibold">{c.label}</p>
              <p className="text-xl font-black text-[#2C2017] mt-1">{c.value}</p>
              <p className="text-xs text-[#9A8878] mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Saturday */}
        {satDays.length > 0 && (
          <Section title={`週六 ${satDays.map(formatDisplayDate).join("、")}`} rows={satRows} />
        )}

        {/* Sunday */}
        {sunDays.length > 0 && (
          <Section title={`週日 ${sunDays.map(formatDisplayDate).join("、")}`} rows={sunRows} />
        )}

        {rows.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-10 text-center text-[#9A8878]">
            本週尚無出席紀錄
          </div>
        )}

        {/* Payout screenshot */}
        <UploadSection
          weekStart={start}
          weekEnd={end}
          totalAmount={totalAmount}
          existingUrl={(payout as any)?.screenshot_url ?? null}
        />
      </main>
    </div>
  );
}

type SectionRow = {
  student: { id: string; name: string; parent_name: string; time_slot: string; day_of_week: string };
  records: { attended_date: string; is_makeup: boolean; substitute_name: string | null; payment_claimed: boolean }[];
  totalLessons: number;
  amountDue: number;
  claimed: boolean;
};

function Section({ title, rows }: { title: string; rows: SectionRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="section-divider">{title}</div>
      <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F0E8] text-[#9A8878] text-xs font-semibold tracking-wide">
              <th className="text-left px-5 py-3.5">學生</th>
              <th className="text-left px-5 py-3.5">時段</th>
              <th className="text-left px-5 py-3.5">出席</th>
              <th className="text-left px-5 py-3.5">金額</th>
              <th className="text-left px-5 py-3.5">轉帳</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {rows.map(({ student, records, totalLessons, amountDue, claimed }) => (
              <tr key={student.id} className="hover:bg-[#FBF8F3] transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-[#2C2017]">{student.name}</p>
                  <p className="text-xs text-[#9A8878]">{student.parent_name}</p>
                </td>
                <td className="px-5 py-3.5 text-[#9A8878]">{student.time_slot}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {records.map((r) => (
                      <span key={r.attended_date} className="text-xs bg-[#A67C52]/10 text-[#A67C52] px-2 py-0.5 rounded-full font-medium">
                        {formatDisplayDate(r.attended_date)}
                        {r.substitute_name ? ` (${r.substitute_name}代)` : ""}
                        {r.is_makeup ? " 補" : ""}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 font-bold text-[#2C2017]">${amountDue}</td>
                <td className="px-5 py-3.5">
                  {claimed ? (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E8F5E9] text-[#4CAF50] border border-[#C8E6C9]">已轉帳</span>
                  ) : (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFF0F0] text-[#E57373] border border-[#FFCDD2]">待轉帳</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
