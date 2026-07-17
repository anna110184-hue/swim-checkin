import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export const revalidate = 0;

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  // 簡單驗證 uuid 格式，避免無效查詢
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();

  const service = createServiceClient();
  const { data: receipt } = await service
    .from("receipts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!receipt) notFound();

  return (
    <div className="min-h-screen bg-[#F5F0E8] print:bg-white flex flex-col items-center px-4 py-8">
      <div className="max-w-xl w-full flex justify-between items-center mb-4 print:hidden">
        <p className="text-xs text-[#9A8878]">此為您的專屬收據，可存成 PDF 保存</p>
        <PrintButton />
      </div>

      <div className="bg-white max-w-xl w-full border border-[#EDE5D8] rounded-3xl p-10 shadow-sm print:border-none print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex justify-between items-start pb-5 border-b-2 border-[#A67C52]">
          <div>
            <h1 className="text-3xl font-black text-[#2C2017] tracking-[0.3em]">收　據</h1>
            <p className="text-[11px] font-semibold text-[#A67C52] tracking-[0.35em] mt-1">SWIM CLASS RECEIPT</p>
          </div>
          <div className="text-right text-[13px] text-[#9A8878] leading-relaxed">
            收據編號：<span className="text-[#2C2017] font-semibold">{receipt.receipt_no}</span><br />
            開立日期：<span className="text-[#2C2017] font-semibold">{formatFullDate(receipt.created_at)}</span>
          </div>
        </div>

        {/* Student info */}
        <div className="mt-6 space-y-0">
          {[
            ["學生姓名", receipt.student_name],
            ["家長姓名", receipt.parent_name],
            ["上課時段", receipt.time_slot],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-dashed border-[#EDE5D8] text-[15px]">
              <span className="text-[#9A8878]">{label}</span>
              <span className="font-semibold text-[#2C2017]">{value}</span>
            </div>
          ))}
        </div>

        {/* Detail table */}
        <table className="w-full mt-6 text-sm">
          <thead>
            <tr className="bg-[#F5F0E8] text-[#9A8878] text-xs tracking-wider">
              <th className="text-left px-4 py-2.5 rounded-l-lg">收款明細</th>
              <th className="text-right px-4 py-2.5">單價</th>
              <th className="text-right px-4 py-2.5">數量</th>
              <th className="text-right px-4 py-2.5 rounded-r-lg">金額</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#F5F0E8]">
              <td className="px-4 py-3 text-[#2C2017]">游泳課程（{receipt.lessons} 堂）</td>
              <td className="px-4 py-3 text-right text-[#2C2017]">${Number(receipt.price_per_lesson).toFixed(0)}</td>
              <td className="px-4 py-3 text-right text-[#2C2017]">{receipt.lessons}</td>
              <td className="px-4 py-3 text-right font-semibold text-[#2C2017]">${Number(receipt.amount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-between items-center bg-[#FBF8F3] border border-[#EDE5D8] rounded-2xl px-5 py-4 mt-4">
          <span className="text-sm font-bold text-[#9A8878] tracking-[0.2em]">實收金額 AUD</span>
          <span className="text-3xl font-black text-[#A67C52]">${Number(receipt.amount).toFixed(2)}</span>
        </div>

        {/* Payment info */}
        <div className="mt-5 space-y-0">
          {[
            ["付款方式", receipt.payment_method],
            ["收款日期", formatFullDate(receipt.paid_date)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2.5 border-b border-dashed border-[#EDE5D8] text-[15px]">
              <span className="text-[#9A8878]">{label}</span>
              <span className="font-semibold text-[#2C2017]">{value}</span>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="mt-5 text-xs text-[#9A8878] leading-relaxed bg-[#FBF8F3] rounded-xl px-4 py-3">
          {receipt.note ??
            "備註：缺課當週如自行安排代課者，課程照常計算；缺課且無代課者，該堂不計費，學期結束後依實際上課堂數多退少補，餘額退還家長。出席紀錄以打卡系統為準。"}
        </p>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-end">
          <span className="inline-block text-[#4CAF50] border-[3px] border-[#4CAF50] rounded-lg px-4 py-1 text-lg font-black tracking-[0.3em] -rotate-6">
            已收訖
          </span>
          <div className="text-[13px] text-[#9A8878]">
            收款人：<span className="text-[#2C2017] font-semibold border-b border-[#2C2017] px-2 pb-0.5">Tzu-an Chen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
