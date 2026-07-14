import { createServiceClient } from "@/lib/supabase/server";
import { getThisWeekRange, formatDisplayDate } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 0;

const PRICE_PER_LESSON = 45;

export default async function PublicWeeklyReportPage() {
  const supabase = createServiceClient();
  const { start, end, days } = getThisWeekRange();

  const [{ data: students }, { data: attendance }, { data: payout }] = await Promise.all([
    supabase.from("students").select("*").order("day_of_week").order("time_slot"),
    supabase
      .from("attendance")
      .select("*")
      .gte("attended_date", start)
      .lte("attended_date", end)
      .eq("is_cancelled", false),
    supabase.from("weekly_payouts").select("*").eq("week_start", start).maybeSingle(),
  ]);

  const studentList = students ?? [];
  const attendanceList = attendance ?? [];

  const satDays = days.filter((d) => new Date(d).getDay() === 6);
  const sunDays = days.filter((d) => new Date(d).getDay() === 0);

  function getAttendees(dow: "sat" | "sun") {
    return studentList
      .filter((s: any) => s.day_of_week === dow)
      .map((s: any) => {
        const records = attendanceList.filter((a: any) => a.student_id === s.id);
        const amount = records.length * PRICE_PER_LESSON;
        return { ...s, records, attended: records.length > 0, amount };
      });
  }

  const satStudents = getAttendees("sat");
  const sunStudents = getAttendees("sun");
  const totalLessons = attendanceList.length;
  const totalAmount = totalLessons * PRICE_PER_LESSON;
  const satAttended = satStudents.filter((s: any) => s.attended).length;
  const sunAttended = sunStudents.filter((s: any) => s.attended).length;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <header className="bg-[#F5F0E8] px-6 pt-8 pb-4 max-w-3xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#2C2017] tracking-tight">本週出席週報</h1>
          <p className="text-sm font-medium text-[#A67C52] tracking-[0.2em] mt-0.5">
            {formatDisplayDate(start)} ～ {formatDisplayDate(end)}
          </p>
        </div>
        <Link href="/" className="btn-outline text-sm mt-1">← 返回首頁</Link>
      </header>

      <div className="h-px bg-[#D4C8B8] mx-6" />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Summary — Saturday only */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "週六出席", value: `${satAttended} 位`, sub: `共 ${satStudents.length} 位` },
            { label: "本週總堂數", value: `${satStudents.filter((s: any) => s.attended).length} 堂`, sub: "每堂 $45" },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-[#EDE5D8] p-4 text-center">
              <p className="text-xs text-[#9A8878] font-semibold">{c.label}</p>
              <p className="text-2xl font-black text-[#A67C52] mt-1">{c.value}</p>
              <p className="text-xs text-[#9A8878] mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Saturday only */}
        {satDays.length > 0 && satStudents.length > 0 && (
          <DaySection
            title={`週六　${satDays.map(formatDisplayDate).join("、")}`}
            students={satStudents}
          />
        )}

        {satAttended === 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-10 text-center text-[#9A8878]">
            本週尚無出席紀錄
          </div>
        )}

        {/* Sunday is intentionally hidden from parent view */}

        {/* Payout screenshot */}
        {(payout as any)?.screenshot_url && (
          <div className="space-y-3">
            <div className="section-divider">匯款截圖</div>
            <div className="bg-white rounded-2xl border border-[#EDE5D8] p-4 inline-block max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(payout as any).screenshot_url}
                alt="匯款截圖"
                className="max-w-full max-h-[480px] rounded-xl object-contain"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

type StudentRow = {
  id: string;
  name: string;
  time_slot: string;
  amount: number;
  records: { attended_date: string; is_makeup: boolean; substitute_name: string | null }[];
  attended: boolean;
};

function DaySection({ title, students }: { title: string; students: StudentRow[] }) {
  const attended = students.filter((s) => s.attended);
  const absent = students.filter((s) => !s.attended);

  return (
    <div className="space-y-3">
      <div className="section-divider">{title}</div>

      {attended.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
          <div className="bg-[#E8F5E9] px-5 py-2.5 border-b border-[#C8E6C9]">
            <p className="text-xs font-bold text-[#388E3C]">✓ 已出席（{attended.length} 位）</p>
          </div>
          <ul className="divide-y divide-[#F5F0E8]">
            {attended.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[#2C2017] text-sm">{s.name}</span>
                  <span className="text-xs text-[#9A8878]">{s.time_slot}</span>
                  {s.records.map((r) => (
                    <span key={r.attended_date} className="text-xs bg-[#A67C52]/10 text-[#A67C52] px-2 py-0.5 rounded-full font-medium">
                      {formatDisplayDate(r.attended_date)}
                      {r.substitute_name ? ` (${r.substitute_name}代)` : ""}
                      {r.is_makeup ? " 補" : ""}
                    </span>
                  ))}
                </div>
                <span className="text-sm font-bold text-[#2C2017] shrink-0">${s.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {absent.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
          <div className="bg-[#FBF8F3] px-5 py-2.5 border-b border-[#EDE5D8]">
            <p className="text-xs font-bold text-[#9A8878]">本週缺席（{absent.length} 位）</p>
          </div>
          <ul className="divide-y divide-[#F5F0E8]">
            {absent.map((s) => (
              <li key={s.id} className="flex items-center px-5 py-3 gap-2">
                <span className="text-sm text-[#9A8878]">{s.name}</span>
                <span className="text-xs text-[#9A8878]">{s.time_slot}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
