"use client";

import { useState } from "react";
import { Notice } from "@/lib/supabase/types";

interface Props {
  initialNotices: Notice[];
}

export default function NoticesTab({ initialNotices }: Props) {
  const [notices, setNotices] = useState(initialNotices);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inp = "border border-[#EDE5D8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40 bg-[#FBF8F3] w-full";

  async function handleCreate() {
    if (!title.trim() || !content.trim()) {
      setErrorMsg("請填寫標題和內容");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, expires_at: expiresAt || null }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setNotices((prev) => [data, ...prev]);
      setTitle("");
      setContent("");
      setExpiresAt("");
    } else {
      setErrorMsg("發布失敗，請再試");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const res = await fetch("/api/admin/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-white rounded-2xl border border-[#EDE5D8] p-5 space-y-4">
        <p className="font-bold text-[#2C2017]">發布新公告</p>
        {errorMsg && (
          <p className="text-xs text-[#E57373] bg-[#FFF0F0] px-3 py-2 rounded-xl border border-[#FFCDD2]">{errorMsg}</p>
        )}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="公告標題（例：教練請假通知）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className={inp}
          />
          <textarea
            placeholder="公告內容（例：本週六 7/19 教練請假，課程停課一次，下週正常上課）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={500}
            className={`${inp} resize-none`}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#9A8878] shrink-0">到期日（可選）：</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="border border-[#EDE5D8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67C52]/40 bg-[#FBF8F3]"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || !title.trim() || !content.trim()}
              className="btn-gold px-6 py-2 text-sm"
            >
              {loading ? "發布中…" : "📢 發布公告"}
            </button>
          </div>
        </div>
      </div>

      {/* Existing notices */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#9A8878]">現有公告（{notices.length} 則）</p>
        {notices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-8 text-center text-[#9A8878] text-sm">
            尚無公告
          </div>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-[#EDE5D8] p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-[#2C2017]">{n.title}</p>
                <p className="text-sm text-[#9A8878] whitespace-pre-line">{n.content}</p>
                <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
                  <span className="text-[#9A8878]">發布：{n.created_at.slice(0, 10)}</span>
                  {n.expires_at && (() => {
                    const msLeft = new Date(n.expires_at).getTime() - new Date().setHours(0, 0, 0, 0);
                    const daysLeft = Math.round(msLeft / 86400000);
                    if (daysLeft <= 0) return <span className="font-semibold text-[#E57373]">今天到期</span>;
                    if (daysLeft === 1) return <span className="font-semibold text-[#E57373]">明天到期</span>;
                    if (daysLeft <= 7) return <span className="font-semibold text-[#EF9A3C]">還有 {daysLeft} 天到期</span>;
                    return <span className="text-[#9A8878]">到期：{n.expires_at}</span>;
                  })()}
                </div>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                disabled={loading}
                className="shrink-0 text-xs px-3 py-1.5 rounded-xl border border-[#FFCDD2] text-[#E57373] hover:bg-[#FFF0F0] transition-colors"
              >
                刪除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
