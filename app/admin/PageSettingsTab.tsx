"use client";

import { useState } from "react";

interface Props {
  initialShowSat: boolean;
  initialShowSun: boolean;
}

export default function PageSettingsTab({ initialShowSat, initialShowSun }: Props) {
  const [showSat, setShowSat] = useState(initialShowSat);
  const [showSun, setShowSun] = useState(initialShowSun);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function toggle(key: string, current: boolean, setter: (v: boolean) => void) {
    setSaving(key);
    setMessage("");
    const newVal = !current;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: String(newVal) }),
    });
    if (res.ok) {
      setter(newVal);
      setMessage("已儲存");
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage("儲存失敗，請再試");
    }
    setSaving(null);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-base font-bold text-[#2C2017]">首頁顯示設定</h2>
        <p className="text-sm text-[#9A8878] mt-0.5">控制家長端首頁顯示哪些班別</p>
      </div>

      <div className="space-y-3">
        {[
          { key: "show_saturday", label: "週六班", sub: "顯示週六學生打卡頁面", value: showSat, setter: setShowSat },
          { key: "show_sunday", label: "週日班", sub: "顯示週日學生打卡頁面", value: showSun, setter: setShowSun },
        ].map(({ key, label, sub, value, setter }) => (
          <div
            key={key}
            className="bg-white rounded-2xl border border-[#EDE5D8] px-5 py-4 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold text-[#2C2017] text-sm">{label}</p>
              <p className="text-xs text-[#9A8878] mt-0.5">{sub}</p>
            </div>
            <button
              onClick={() => toggle(key, value, setter)}
              disabled={saving === key}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 shrink-0 ${
                value ? "bg-[#A67C52]" : "bg-[#D4C8B8]"
              } ${saving === key ? "opacity-60" : ""}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  value ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {message && (
        <p className={`text-xs font-semibold ${message === "已儲存" ? "text-[#4CAF50]" : "text-[#E57373]"}`}>
          {message === "已儲存" ? "✓ " : "⚠️ "}{message}
        </p>
      )}

      <div className="bg-[#FFF8E7] border border-[#F5C842] rounded-2xl px-5 py-4 text-sm text-[#7A5200]">
        <p className="font-bold mb-1">💡 說明</p>
        <p>關閉某班別後，家長端首頁將不會顯示該班的打卡頁面及學生名單。後台管理不受影響。</p>
      </div>
    </div>
  );
}
