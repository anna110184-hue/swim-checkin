"use client";

import { useState, useRef } from "react";

interface Props {
  weekStart: string;
  weekEnd: string;
  totalAmount: number;
  existingUrl: string | null;
}

export default function UploadSection({ weekStart, weekEnd, totalAmount, existingUrl }: Props) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(existingUrl);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setErrorMsg("");
    const form = new FormData();
    form.append("file", file);
    form.append("week_start", weekStart);
    form.append("week_end", weekEnd);
    form.append("total_amount", String(totalAmount));

    try {
      const res = await fetch("/api/admin/payout-upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(`上傳失敗：${json.error ?? res.status}`);
      } else {
        setScreenshotUrl(json.data.screenshot_url);
      }
    } catch (e) {
      setErrorMsg(`網路錯誤：${e instanceof Error ? e.message : String(e)}`);
    }
    setUploading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/admin/payout-upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start: weekStart }),
    });
    if (res.ok) setScreenshotUrl(null);
    setDeleting(false);
  }

  return (
    <div className="space-y-4 print:mt-6">
      {/* Section header — hidden when printing if no screenshot */}
      {!screenshotUrl && (
        <div className="print:hidden section-divider">匯款截圖</div>
      )}
      {screenshotUrl && (
        <div className="section-divider">匯款截圖</div>
      )}

      {screenshotUrl ? (
        <div className="space-y-3">
          {/* Screenshot image — visible in print */}
          <div className="bg-white rounded-2xl border border-[#EDE5D8] p-4 inline-block max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotUrl}
              alt="匯款截圖"
              className="max-w-full max-h-[480px] rounded-xl object-contain"
            />
          </div>
          {/* Delete button — hidden when printing */}
          <div className="print:hidden">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs px-4 py-2 rounded-xl border border-[#FFCDD2] text-[#E57373] hover:bg-[#FFF0F0] transition-colors"
            >
              {deleting ? "刪除中…" : "🗑 移除截圖"}
            </button>
          </div>
        </div>
      ) : (
        /* Upload area — hidden when printing */
        <div className="print:hidden space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-white border-2 border-dashed border-[#D4C8B8] rounded-2xl px-8 py-6 text-sm text-[#9A8878] hover:border-[#A67C52] hover:text-[#A67C52] transition-colors w-full justify-center disabled:opacity-60"
          >
            {uploading ? (
              <span>上傳中…請稍候</span>
            ) : (
              <>
                <span className="text-2xl">📎</span>
                <span>點擊上傳匯款截圖（PNG / JPG）</span>
              </>
            )}
          </button>
          {errorMsg && (
            <p className="text-xs text-[#E57373] bg-[#FFF0F0] px-4 py-2 rounded-xl border border-[#FFCDD2]">
              ⚠️ {errorMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
