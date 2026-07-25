import { createServiceClient } from "@/lib/supabase/server";
import { formatDisplayDate } from "@/lib/utils";
import { format, addDays, parseISO, isValid } from "date-fns";
import { notFound } from "next/navigation";

export const revalidate = 0;

const PRICE_PER_LESSON = 45;
const SPECIAL_PRICES: Record<string, number> = {
  Zachary: 30,
};

export default async function TeacherWeeklyReportPage({
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

  const supabase = createServiceClient();
  const [{ data: students }, { data: attendance }, { data: payout }] =
    await Promise.all([
      supabase.from("students").select("*").order("day_of_week").order("time_slot"),
      supabase
        .from("attendance")
        .select("*")
        .gte("attended_date", start)
        .lte("attended_date", end),
      supabase
        .from("weekly_payouts")
        .select("*")
        .eq("week_start", start)
        .maybeSingle(),
    ]);

  const studentList = students ?? [];
  const attendanceList = attendance ?? [];

  const rows = studentList
    .map((s: any) => {
      const records = attendanceList.filter(
        (a: any) => a.student_id === s.id && !a.is_cancelled
      );
      const price = SPECIAL_PRICES[s.name] ?? PRICE_PER_LESSON;
      return {
        student: s,
        records,
        totalLessons: records.length,
        amountDue: records.length * price,
        price,
        claimed: records.some((a: any) => a.payment_claimed),
      };
    })
    .filter((r: any) => r.totalLessons > 0);

  const satRows = rows.filter((r: any) => r.student.day_of_week === "sat");
  const sunRows = rows.filter((r: any) => r.student.day_of_week === "sun");
  const satDays = days.filter((d) => new Date(d).getDay() === 6);
  const sunDays = days.filter((d) => new Date(d).getDay() === 0);

  const totalAmount = rows.reduce((s: number, r: any) => s + r.amountDue, 0);
  const claimedAmount = rows
    .filter((r: any) => r.claimed)
    .reduce((s: number, r: any) => s + r.amountDue, 0);
  const pendingAmount = totalAmount - claimedAmount;

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-[#EDE5D8] shadow-sm p-8 space-y-6">

        {/* Header */}
        <div className="flex justify-between items-start pb-5 border-b-2 border-[#A67C52]">
          <div>
            <h1 className="text-3xl font-black text-[#2C2017] tracking-tight">週課紀錄</h1>
            <p className="text-sm font-semibold text-[#A67C52] tracking-[0.25em] mt-1">WEEKLY REPORT</p>
          </div>
          <div className="text-right text-sm text-[#9A8878] leading-relaxed">
            <p>{formatDisplayDate(start)} ～ {formatDisplayDate(end)}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "應收", value: `$${totalAmount}` },
            { label: "已轉帳", value: `$${claimedAmount}` },
            { label: "待轉帳", value: `$${pendingAmount}`, highlight: pendingAmount > 0 },
          ].map((c) => (
            <div key={c.label} className="bg-[#FBF8F3] rounded-2xl border border-[#EDE5D8] p-3 text-center">
              <p className="text-xs text-[#9A8878] font-semibold">{c.label}</p>
              <p className={`text-xl font-black mt-0.5 ${c.highlight ? "text-[#E57373]" : "text-[#A67C52]"}`}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Saturday */}
        {satDays.length > 0 && satRows.length > 0 && (
          <ReportSection
            title={`週六　${satDays.map(formatDisplayDate).join("、")}`}
            rows={satRows}
            specialPrices={SPECIAL_PRICES}
          />
        )}

        {/* Sunday */}
        {sunDays.length > 0 && sunRows.length > 0 && (
          <ReportSection
            title={`週日　${sunDays.map(formatDisplayDate).join("、")}`}
            rows={sunRows}
            specialPrices={SPECIAL_PRICES}
          />
        )}

        {rows.length === 0 && (
          <p className="text-center text-[#9A8878] py-8">本週尚無出席紀錄</p>
        )}

        {/* Payment screenshot */}
        {(payout as any)?.screenshot_url && (
          <div className="space-y-3 pt-2 border-t border-[#EDE5D8]">
            <p className="text-xs font-bold text-[#9A8878] tracking-[0.2em]">匯款截圖</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(payout as any).screenshot_url}
              alt="匯款截圖"
              className="w-full max-h-[400px] object-contain rounded-2xl border border-[#EDE5D8]"
            />
          </div>
        )}

        {!(payout as any)?.screenshot_url && (
          <div className="pt-2 border-t border-[#EDE5D8]">
            <p className="text-xs text-[#9A8878] text-center py-4">匯款截圖尚未上傳</p>
          </div>
        )}
      </div>
    </div>
  );
}

type Row = {
  student: { id: string; name: string; parent_name: string; time_slot: string };
  records: { attended_date: string; is_makeup: boolean; substitute_name: string | null; payment_claimed: boolean }[];
  totalLessons: number;
  amountDue: number;
  price: number;
  claimed: boolean;
};

function ReportSection({
  title,
  rows,
  specialPrices,
}: {
  title: string;
  rows: Row[];
  specialPrices: Record<string, number>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-[#9A8878] tracking-[0.2em] uppercase">{title}</p>
      <div className="rounded-2xl border border-[#EDE5D8] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F5F0E8] text-[#9A8878] text-xs font-semibold">
              <th className="text-left px-4 py-3">學生</th>
              <th className="text-left px-4 py-3">出席</th>
              <th className="text-right px-4 py-3">金額</th>
              <th className="text-right px-4 py-3">轉帳</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {rows.map(({ student, records, amountDue, claimed }) => (
              <tr key={student.id}>
                <td className="px-4 py-3">
                  <p className="font-bold text-[#2C2017]">{student.name}</p>
                  <p className="text-xs text-[#9A8878]">{student.time_slot}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {records.map((r) => (
                      <span
                        key={r.attended_date}
                        className="text-xs bg-[#A67C52]/10 text-[#A67C52] px-2 py-0.5 rounded-full font-medium"
                      >
                        {formatDisplayDate(r.attended_date)}
                        {r.substitute_name ? ` (${r.substitute_name}代)` : ""}
                        {r.is_makeup ? " 補" : ""}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-[#2C2017]">${amountDue}</span>
                  {specialPrices[student.name] !== undefined && (
                    <span className="block text-xs text-[#9A8878]">${specialPrices[student.name]}/堂</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {claimed ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#E8F5E9] text-[#4CAF50] border border-[#C8E6C9]">
                      已轉
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#FFF0F0] text-[#E57373] border border-[#FFCDD2]">
                      待轉
                    </span>
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
