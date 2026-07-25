"use client";

import { useState } from "react";

export default function ShareButton({ weekStart }: { weekStart: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/report/${weekStart}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="btn-outline text-sm print:hidden"
    >
      {copied ? "✓ 已複製連結" : "📋 複製週報連結"}
    </button>
  );
}
