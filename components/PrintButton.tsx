"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-gold px-5 py-2 text-sm print:hidden">
      🖨 列印 / 存成 PDF
    </button>
  );
}
