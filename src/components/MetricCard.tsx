interface MetricCardProps {
  eyebrow: string;
  value: string;
  helperText?: string;
  accent?: "default" | "positive" | "negative" | "cyan";
}

export function MetricCard({
  eyebrow,
  value,
  helperText,
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
      {helperText ? (
        <p className="mt-1.5 text-[10px] font-medium leading-4 text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
