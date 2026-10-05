import type { CampaignInsight } from "../lib/insights";

export function InsightList({ insights }: { insights: CampaignInsight[] }) {
  const toneClass = {
    violet: "border-violet-100 bg-violet-50/80 before:bg-violet-500",
    cyan: "border-cyan-100 bg-cyan-50/80 before:bg-cyan-500",
    emerald: "border-emerald-100 bg-emerald-50/80 before:bg-emerald-500",
    amber: "border-amber-100 bg-amber-50/80 before:bg-amber-500",
    rose: "border-rose-100 bg-rose-50/80 before:bg-rose-500",
  };

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div
          className={`relative rounded-xl border py-3 pl-9 pr-4 text-sm leading-6 text-slate-700 before:absolute before:left-4 before:top-5 before:h-2 before:w-2 before:rounded-full ${toneClass[insight.tone]}`}
          key={insight.text}
        >
          {insight.text}
        </div>
      ))}
    </div>
  );
}
