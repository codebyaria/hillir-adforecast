import type { CSSProperties } from "react";

import { formatIdr } from "../../shared/format";

interface MoneyInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  suggestedMax: number;
  step: number;
  error?: string;
  onChange: (value: number) => void;
}

export function MoneyInput({
  id,
  label,
  value,
  min,
  suggestedMax,
  step,
  error,
  onChange,
}: MoneyInputProps) {
  const rangeMin = 0;
  const rangeMax = Math.max(
    suggestedMax,
    Math.ceil(Math.max(value, rangeMin) / step) * step,
  );
  const safeRangeValue = Number.isFinite(value)
    ? Math.min(Math.max(value, rangeMin), rangeMax)
    : rangeMin;
  const rangeProgress = rangeMax > rangeMin
    ? ((safeRangeValue - rangeMin) / (rangeMax - rangeMin)) * 100
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <label className="text-sm font-bold text-slate-800" htmlFor={id}>
          {label}
        </label>
        <span className="text-right text-sm font-black text-violet-600">
          {Number.isFinite(value) ? formatIdr(value) : "-"}
        </span>
      </div>
      <input
        aria-label={`${label} slider`}
        className="campaign-range w-full"
        max={rangeMax}
        min={rangeMin}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        style={{ "--range-progress": `${rangeProgress}%` } as CSSProperties}
        type="range"
        value={safeRangeValue}
      />
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`h-11 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:ring-4 ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-200 focus:border-violet-500 focus:ring-violet-100"
        }`}
        id={id}
        inputMode="decimal"
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step="any"
        type="number"
        value={Number.isFinite(value) ? value : ""}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-600" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
