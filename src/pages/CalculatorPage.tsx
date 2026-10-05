import { useEffect, useMemo, useState } from "react";
import Decimal from "decimal.js";
import {
  ArrowRight,
  BarChart3,
  Check,
  Lightbulb,
  Save,
  SlidersHorizontal,
  TrendingUp,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { calculateCampaign } from "../../shared/calculation";
import { formatIdr, formatResultCount, formatRoi } from "../../shared/format";
import type { CalculationInput } from "../../shared/types";
import { calculationInputSchema } from "../../shared/validation";
import { useAuth } from "../auth/AuthContext";
import { InsightList } from "../components/InsightList";
import { MetricCard } from "../components/MetricCard";
import { MoneyInput } from "../components/MoneyInput";
import { ApiError, createCalculation } from "../lib/api";
import { getCampaignInsights } from "../lib/insights";

const INITIAL_INPUT: CalculationInput = {
  productPrice: 500_000,
  adSpend: 5_000_000,
  costPerResult: 100_000,
  averageOrderValue: 500_000,
};

const inputConfigs = [
  {
    key: "productPrice",
    label: "Harga Produk",
    min: 0,
    suggestedMax: 5_000_000,
    step: 10_000,
  },
  {
    key: "adSpend",
    label: "Pengeluaran Iklan Bulanan",
    min: 1,
    suggestedMax: 50_000_000,
    step: 100_000,
  },
  {
    key: "costPerResult",
    label: "Cost per Result (CPR)",
    min: 1,
    suggestedMax: 1_000_000,
    step: 5_000,
  },
  {
    key: "averageOrderValue",
    label: "Nilai Pesanan Rata-rata",
    min: 0,
    suggestedMax: 5_000_000,
    step: 10_000,
  },
] as const;

function statusCopy(status: "profitable" | "break_even" | "needs_optimization") {
  return {
    profitable: "Kampanye Menguntungkan",
    break_even: "Titik Impas",
    needs_optimization: "Perlu Optimasi",
  }[status];
}

export function CalculatorPage() {
  const { refresh } = useAuth();
  const [input, setInput] = useState<CalculationInput>(INITIAL_INPUT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const parsed = useMemo(() => calculationInputSchema.safeParse(input), [input]);
  const fieldErrors = useMemo(
    () =>
      parsed.success
        ? {}
        : Object.fromEntries(
            parsed.error.issues.map((issue) => [
              String(issue.path[0]),
              issue.message,
            ]),
          ),
    [parsed],
  );
  const result = useMemo(
    () => (parsed.success ? calculateCampaign(parsed.data) : null),
    [parsed],
  );
  const insights = useMemo(
    () => (result ? getCampaignInsights(input, result) : []),
    [input, result],
  );

  useEffect(() => {
    if (!saveSuccess) return;
    const timeout = window.setTimeout(() => setSaveSuccess(""), 4_000);
    return () => window.clearTimeout(timeout);
  }, [saveSuccess]);

  function updateInput(key: keyof CalculationInput, value: number) {
    setInput((current) => ({ ...current, [key]: value }));
    setSaveError("");
    setSaveSuccess("");
  }

  async function saveCalculation() {
    if (!parsed.success) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const saved = await createCalculation(parsed.data);
      const time = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(saved.createdAt));
      setSaveSuccess(`Simulasi tersimpan ke riwayat pada ${time}.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await refresh().catch(() => undefined);
      }
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "Simulasi belum berhasil disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  const profitIsPositive = result
    ? new Decimal(result.profitAfterAds).isPositive()
    : false;

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_8%_0%,rgba(124,58,237,0.07),transparent_27%),radial-gradient(circle_at_92%_0%,rgba(6,182,212,0.06),transparent_24%),#f8fafc]">
      {saveSuccess ? (
        <div className="save-toast fixed right-4 top-24 z-30 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl shadow-slate-400/25 sm:right-6" role="status">
          <div className="flex items-start gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true"><Check size={18} strokeWidth={2.5} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-950">Simulasi berhasil disimpan</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{saveSuccess}</p>
              <Link className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-violet-700 transition hover:text-violet-900 focus:outline-none focus:underline" to="/history">Lihat riwayat <ArrowRight aria-hidden="true" size={13} /></Link>
            </div>
            <button aria-label="Tutup notifikasi" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100" onClick={() => setSaveSuccess("")} type="button"><X aria-hidden="true" size={17} /></button>
          </div>
          <div aria-hidden="true" className="save-toast-progress h-1 origin-left bg-gradient-to-r from-emerald-500 to-cyan-500" />
        </div>
      ) : null}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Kalkulator ROI Kampanye
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Ubah parameter untuk melihat proyeksi performa secara langsung.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.18fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/45 lg:sticky lg:top-28">
            <div className="p-6 sm:p-7">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700" aria-hidden="true"><SlidersHorizontal size={18} /></span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Parameter Kampanye</h2>
                    <p className="mt-1 text-xs text-slate-500">Sesuaikan asumsi kampanye Anda.</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Real-time
                </span>
              </div>
              <div className="space-y-6">
                {inputConfigs.map((config) => (
                  <MoneyInput
                    error={fieldErrors[config.key]}
                    id={config.key}
                    key={config.key}
                    label={config.label}
                    min={config.min}
                    onChange={(value) => updateInput(config.key, value)}
                    step={config.step}
                    suggestedMax={config.suggestedMax}
                    value={input[config.key]}
                  />
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:px-7">
              <button className="brand-gradient-horizontal flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-4 focus:ring-violet-200" disabled={saving || !parsed.success} onClick={() => void saveCalculation()} type="button">
                <Save aria-hidden="true" size={17} />{saving ? "Menyimpan..." : "Simpan simulasi"}
              </button>
              <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">Parameter dan hasil akan disimpan ke riwayat.</p>
              {saveError ? <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{saveError}</p> : null}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 shadow-xl shadow-slate-200/45 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-100 text-cyan-700" aria-hidden="true"><BarChart3 size={18} /></span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Hasil Prediksi</h2>
                    <p className="mt-1 text-xs text-slate-500">Berdasarkan parameter kampanye saat ini.</p>
                  </div>
                </div>
                <span className="hidden text-xs font-medium text-slate-400 sm:block">Diperbarui sekarang</span>
              </div>

              {result ? (
                <>
                  <div className="brand-gradient rounded-2xl p-6 text-left text-white shadow-xl shadow-blue-200 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white/75">Laba atas Investasi (ROI)</p>
                        <p className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">{formatRoi(result.roiPercentage)}</p>
                        <p className="mt-2 text-sm font-semibold text-white/85">{statusCopy(result.status)}</p>
                      </div>
                      <TrendingUp className="text-white/80" aria-hidden="true" size={23} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetricCard eyebrow="Pendapatan" value={formatIdr(result.revenue)} accent="cyan" />
                    <MetricCard eyebrow="Keuntungan" value={formatIdr(result.profitAfterAds)} accent={profitIsPositive ? "cyan" : result.status === "break_even" ? "default" : "negative"} />
                    <MetricCard eyebrow="Jumlah hasil" value={formatResultCount(result.resultCount)} />
                    <MetricCard eyebrow="Target CPR" value={formatIdr(result.targetCpr)} />
                  </div>
                  <div className="mt-3 grid gap-4 rounded-2xl border border-white bg-white/95 p-5 shadow-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Pendapatan per hasil</p>
                      <p className="mt-2 text-xl font-black text-slate-950">{formatIdr(result.revenuePerResult)}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs font-bold text-slate-500">Margin per hasil</p>
                      <p className={`mt-2 text-xl font-black ${new Decimal(result.marginPerResult).isNegative() ? "text-rose-600" : "text-cyan-600"}`}>{formatIdr(result.marginPerResult)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-6 py-14 text-center">
                  <p className="font-bold text-rose-700">Lengkapi parameter yang valid untuk melihat prediksi.</p>
                  <p className="mt-2 text-sm text-rose-600">Periksa pesan pada field yang ditandai.</p>
                </div>
              )}
            </section>

            {result ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600" aria-hidden="true"><Lightbulb size={18} /></span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Wawasan Utama</h2>
                    <p className="mt-1 text-xs text-slate-500">Rekomendasi transparan dari metrik Anda.</p>
                  </div>
                </div>
                <InsightList insights={insights} />
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
