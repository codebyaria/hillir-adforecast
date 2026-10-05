interface MetricCardProps {
  eyebrow: string;
  value: string;
  accent?: "default" | "positive" | "negative" | "cyan";
}

export function MetricCard({
  eyebrow,
  value,
  accent = "default",
}: MetricCardProps) {
  const valueClass = {
    default: "text-slate-950",
    positive: "text-cyan-600",
    negative: "text-rose-600",
    cyan: "text-cyan-600",
  }[accent];

  return (
    <div className="rounded-2xl border border-white bg-white/95 p-4 shadow-sm sm:min-h-24">
      <p className="text-xs font-bold text-slate-500">{eyebrow}</p>
      <p className={`mt-2 truncate text-xl font-black tracking-tight ${valueClass}`} title={value}>
        {value}
      </p>
    </div>
  );
}
