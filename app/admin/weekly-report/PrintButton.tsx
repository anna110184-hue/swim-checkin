"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-gold px-5 py-2.5 text-sm font-bold shrink-0 print:hidden"
    >
      🖨️ 列印 / 儲存 PDF
    </button>
  );
}
