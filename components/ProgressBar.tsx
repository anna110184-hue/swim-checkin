"use client";

interface ProgressBarProps {
  attended: number;
  total: number;
}

export default function ProgressBar({ attended, total }: ProgressBarProps) {
  const pct = Math.min((attended / total) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>已上 {attended} 堂</span>
        <span>共 {total} 堂</span>
      </div>
      <div className="w-full bg-gold-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #B8860B, #D4A017)",
          }}
        />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i < attended ? "bg-gold-500" : "bg-gold-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
