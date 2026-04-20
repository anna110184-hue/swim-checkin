interface ProgressDotsProps {
  attended: number;
  total: number;
}

export default function ProgressDots({ attended, total }: ProgressDotsProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 aspect-square rounded-full max-w-[18px] transition-all ${
              i < attended
                ? "bg-[#A67C52]"
                : "bg-white border-2 border-[#D4C8B8]"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#9A8878]">
        <span>已上 {attended} 堂</span>
        <span>共 {total} 堂</span>
      </div>
      <div className="w-full bg-[#EDE5D8] rounded-full h-1 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#A67C52] transition-all duration-500"
          style={{ width: `${Math.min((attended / total) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
