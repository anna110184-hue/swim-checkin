"use client";

import { useState } from "react";

interface Student {
  id: string;
  name: string;
  parent_name: string;
  day_of_week: string;
  time_slot: string;
}

interface Receipt {
  id: string;
  receipt_no: string;
  student_name: string;
  parent_name: string;
  lessons: number;
  amount: number;
  paid_date: string;
  created_at: string;
}

interface Props {
  students: Student[];
  initialReceipts: Receipt[];
  siteUrl: string;
}

const TODAY = new Date().toISOString().slice(0, 10);

export default function ReceiptsTab({ students, initialReceipts, siteUrl }: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [form, setForm] = useState({
    student_id: "",
    lessons: "10",
    price_per_lesson: "45",
    paid_date: TODAY,
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleIssue() {
    if (!form.student_id) { setError("請選擇學生"); return; }
    setLoading(true);
    setError("");
    setNewLink("");
    const res = await fetch("/api/admin/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: form.student_id,
        lessons: Number(form.lessons),
        price_per_lesson: Number(form.price_per_lesson),
        paid_date: form.paid_date,
        note: form.note || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "開立失敗");
    } else {
      const link = `${siteUrl}/receipt/${json.id}`;
      setNewLink(link);
      // Refresh list
      const student = students.find(s => s.id === form.student_id);
      const lessons = Number(form.lessons);
      const price = Number(form.price_per_lesson);
      setReceipts(prev => [{
        id: json.id,
        receipt_no: json.receipt_no,
        student_name: student?.name ?? "",
        parent_name: student?.parent_name ?? "",
        lessons,
        amount: lessons * price,
        paid_date: form.paid_date,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setForm(f => ({ ...f, student_id: "", note: "" }));
    }
    setLoading(false);
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Issue form */}
      <div className="bg-white rounded-2xl border border-[#EDE5D8] p-6 space-y-4">
        <h2 className="font-bold text-[#2C2017] text-base">開立新收據</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-[#9A8878] mb-1 block">學生</label>
            <select
              value={form.student_id}
              onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
              className="w-full rounded-xl border border-[#EDE5D8] bg-[#FBF8F3] px-3 py-2.5 text-sm text-[#2C2017] focus:outline-none focus:border-[#A67C52]"
            >
              <option value="">— 選擇學生 —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}（{s.day_of_week === "sat" ? "週六" : "週日"} {s.time_slot}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8878] mb-1 block">堂數</label>
            <input
              type="number" min="1"
              value={form.lessons}
              onChange={e => setForm(f => ({ ...f, lessons: e.target.value }))}
              className="w-full rounded-xl border border-[#EDE5D8] bg-[#FBF8F3] px-3 py-2.5 text-sm focus:outline-none focus:border-[#A67C52]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8878] mb-1 block">每堂費用（$）</label>
            <input
              type="number" min="1"
              value={form.price_per_lesson}
              onChange={e => setForm(f => ({ ...f, price_per_lesson: e.target.value }))}
              className="w-full rounded-xl border border-[#EDE5D8] bg-[#FBF8F3] px-3 py-2.5 text-sm focus:outline-none focus:border-[#A67C52]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8878] mb-1 block">收款日期</label>
            <input
              type="date"
              value={form.paid_date}
              onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))}
              className="w-full rounded-xl border border-[#EDE5D8] bg-[#FBF8F3] px-3 py-2.5 text-sm focus:outline-none focus:border-[#A67C52]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8878] mb-1 block">
              總金額（自動計算）
            </label>
            <div className="w-full rounded-xl border border-[#EDE5D8] bg-[#F5F0E8] px-3 py-2.5 text-sm font-bold text-[#A67C52]">
              ${(Number(form.lessons) * Number(form.price_per_lesson)).toFixed(2)}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-[#9A8878] mb-1 block">備註（選填）</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="例：第一期學費"
              className="w-full rounded-xl border border-[#EDE5D8] bg-[#FBF8F3] px-3 py-2.5 text-sm focus:outline-none focus:border-[#A67C52]"
            />
          </div>
        </div>

        {error && <p className="text-xs text-[#E57373]">⚠️ {error}</p>}

        <button
          onClick={handleIssue}
          disabled={loading}
          className="btn-gold px-6 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {loading ? "開立中…" : "🧾 開立收據"}
        </button>

        {/* New link box */}
        {newLink && (
          <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl px-4 py-4 space-y-2">
            <p className="text-xs font-bold text-[#388E3C]">✓ 收據已開立！複製連結傳給家長：</p>
            <div className="flex gap-2 items-center">
              <a href={newLink} target="_blank" rel="noreferrer"
                className="text-xs text-[#1976D2] underline truncate flex-1">{newLink}</a>
              <button
                onClick={() => copyLink(newLink)}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#4CAF50] text-white hover:bg-[#388E3C]"
              >
                {copied ? "已複製！" : "複製"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt history */}
      <div className="space-y-3">
        <h2 className="font-bold text-[#2C2017] text-base">已開立的收據</h2>
        {receipts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-8 text-center text-sm text-[#9A8878]">
            尚無收據紀錄
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F0E8] text-[#9A8878] text-xs font-semibold">
                  <th className="text-left px-4 py-3">收據號</th>
                  <th className="text-left px-4 py-3">學生</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">堂數</th>
                  <th className="text-right px-4 py-3">金額</th>
                  <th className="text-right px-4 py-3">收據連結</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0E8]">
                {receipts.map(r => (
                  <tr key={r.id} className="hover:bg-[#FBF8F3]">
                    <td className="px-4 py-3 text-xs text-[#9A8878] font-mono">{r.receipt_no}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#2C2017]">{r.student_name}</p>
                      <p className="text-xs text-[#9A8878]">{r.parent_name}</p>
                    </td>
                    <td className="px-4 py-3 text-[#9A8878] hidden sm:table-cell">{r.lessons} 堂</td>
                    <td className="px-4 py-3 text-right font-bold text-[#2C2017]">${Number(r.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`${siteUrl}/receipt/${r.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#A67C52] hover:underline font-semibold"
                      >
                        查看 →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
