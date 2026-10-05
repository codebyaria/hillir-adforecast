import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Decimal from "decimal.js";
import {
  ChevronRight,
  History,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { formatIdr, formatResultCount, formatRoi } from "../../shared/format";
import type { CalculationInput, CalculationResult } from "../../shared/types";
import { useAuth } from "../auth/AuthContext";
import { InsightList } from "../components/InsightList";
import {
  ApiError,
  type CalculationHistoryResponse,
  type CalculationRecord,
  getCalculationHistory,
} from "../lib/api";
import { getCampaignInsights } from "../lib/insights";

const PAGE_SIZE = 6;

function statusMeta(status: CalculationRecord["status"]) {
  return {
    profitable: {
      label: "Menguntungkan",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    break_even: {
      label: "Impas",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    needs_optimization: {
      label: "Perlu Optimasi",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    },
  }[status];
}

function calculationDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function insightsFromCalculation(calculation: CalculationRecord) {
  const input: CalculationInput = {
    productPrice: Number(calculation.productPrice),
    adSpend: Number(calculation.adSpend),
    costPerResult: Number(calculation.costPerResult),
    averageOrderValue: Number(calculation.averageOrderValue),
  };
  const result: CalculationResult = {
    formulaVersion: calculation.formulaVersion,
    resultCount: calculation.resultCount,
    revenue: calculation.revenue,
    profitAfterAds: calculation.profitAfterAds,
    roiPercentage: calculation.roiPercentage,
    targetCpr: calculation.targetCpr,
    revenuePerResult: calculation.revenuePerResult,
    marginPerResult: calculation.marginPerResult,
    status: calculation.status,
    isCprHealthy: new Decimal(calculation.costPerResult).lessThanOrEqualTo(
      calculation.targetCpr,
    ),
  };

  return getCampaignInsights(input, result);
}

function HistoryRow({
  calculation,
  onSelect,
}: {
  calculation: CalculationRecord;
  onSelect: (calculation: CalculationRecord) => void;
}) {
  const status = statusMeta(calculation.status);
  const profitIsNegative = new Decimal(calculation.profitAfterAds).isNegative();

  return (
    <button
      className="grid w-full gap-4 border-b border-slate-100 bg-white px-5 py-5 text-left transition last:border-b-0 hover:bg-violet-50/45 focus:relative focus:z-10 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-violet-100 sm:grid-cols-[minmax(230px,1.2fr)_minmax(110px,0.55fr)_minmax(140px,0.65fr)_minmax(130px,0.6fr)_24px] sm:items-center sm:px-6"
      onClick={() => onSelect(calculation)}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700" aria-hidden="true"><TrendingUp size={18} /></span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-slate-900">{calculationDate(calculation.createdAt)}</span>
          <span className="mt-1 block text-xs text-slate-500">Formula {calculation.formulaVersion} · Anggaran {formatIdr(calculation.adSpend)}</span>
        </span>
      </span>

      <span className="grid grid-cols-2 gap-3 sm:contents">
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">ROI</span>
          <span className={`mt-1 block text-sm font-black ${calculation.status === "needs_optimization" ? "text-rose-600" : "text-cyan-600"}`}>{formatRoi(calculation.roiPercentage)}</span>
        </span>
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Keuntungan</span>
          <span className={`mt-1 block truncate text-sm font-black ${profitIsNegative ? "text-rose-600" : "text-slate-900"}`} title={formatIdr(calculation.profitAfterAds)}>{formatIdr(calculation.profitAfterAds)}</span>
        </span>
        <span className="col-span-2 sm:col-auto">
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:hidden">Status</span>
          <span className={`mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-black ring-1 sm:mt-0 ${status.className}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {status.label}
          </span>
        </span>
      </span>

      <ChevronRight className="hidden text-slate-400 sm:block" aria-hidden="true" size={18} />
    </button>
  );
}

function SnapshotDrawer({
  calculation,
  onClose,
}: {
  calculation: CalculationRecord;
  onClose: () => void;
}) {
  const status = statusMeta(calculation.status);
  const insights = insightsFromCalculation(calculation);
  const profitIsNegative = new Decimal(calculation.profitAfterAds).isNegative();
  const marginIsNegative = new Decimal(calculation.marginPerResult).isNegative();
  const previouslyFocusedRef = useRef(document.activeElement as HTMLElement | null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previouslyFocusedRef.current?.focus();
    };
  }, [onClose]);

  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("hidden"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Tutup detail simulasi" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" onClick={onClose} type="button" />
      <aside aria-label="Detail simulasi" aria-modal="true" className="snapshot-drawer absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:max-w-lg" onKeyDown={trapFocus} role="dialog">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">Detail Simulasi</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">{calculationDate(calculation.createdAt)}</h2>
            <p className="mt-1 text-xs text-slate-500">Formula {calculation.formulaVersion}</p>
          </div>
          <button autoFocus aria-label="Tutup detail" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-violet-100" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="brand-gradient rounded-2xl p-5 text-white shadow-xl shadow-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white/70">Laba atas Investasi (ROI)</p>
                <p className="mt-2 text-4xl font-black tracking-tight">{formatRoi(calculation.roiPercentage)}</p>
                <p className="mt-2 text-xs font-bold text-white/85">{status.label}</p>
              </div>
              <TrendingUp className="text-white/80" aria-hidden="true" size={23} />
            </div>
          </section>

          <section className="mt-5" aria-labelledby="snapshot-results-title">
            <h3 className="text-sm font-black text-slate-900" id="snapshot-results-title">Hasil Prediksi</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                ["Pendapatan", formatIdr(calculation.revenue), "text-slate-950"],
                ["Keuntungan", formatIdr(calculation.profitAfterAds), profitIsNegative ? "text-rose-600" : "text-cyan-600"],
                ["Jumlah hasil", formatResultCount(calculation.resultCount), "text-slate-950"],
                ["Target CPR", formatIdr(calculation.targetCpr), "text-slate-950"],
                ["Pendapatan per hasil", formatIdr(calculation.revenuePerResult), "text-slate-950"],
                ["Margin per hasil", formatIdr(calculation.marginPerResult), marginIsNegative ? "text-rose-600" : "text-cyan-600"],
              ].map(([label, value, valueClass]) => (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5" key={label}>
                  <p className="text-[11px] font-bold text-slate-500">{label}</p>
                  <p className={`mt-1.5 truncate text-sm font-black ${valueClass}`} title={value}>{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6" aria-labelledby="snapshot-parameters-title">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-black text-slate-900" id="snapshot-parameters-title">Parameter Kampanye</h3>
              <span className="text-[11px] font-bold text-slate-400">Parameter tersimpan</span>
            </div>
            <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
              {[
                ["Harga Produk", formatIdr(calculation.productPrice)],
                ["Pengeluaran Iklan Bulanan", formatIdr(calculation.adSpend)],
                ["Cost per Result (CPR)", formatIdr(calculation.costPerResult)],
                ["Nilai Pesanan Rata-rata", formatIdr(calculation.averageOrderValue)],
              ].map(([label, value]) => (
                <div className="flex items-center justify-between gap-4 py-3" key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-right text-xs font-black text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-6" aria-labelledby="snapshot-insights-title">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-sm font-black text-slate-900" id="snapshot-insights-title">Wawasan Simulasi</h3>
              <span className="text-[11px] font-bold text-slate-400">3 wawasan</span>
            </div>
            <InsightList insights={insights} />
          </section>
        </div>
      </aside>
    </div>
  );
}

function LoadingHistory() {
  return (
    <div aria-label="Memuat riwayat" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" role="status">
      {[0, 1, 2, 3].map((item) => (
        <div className="h-24 animate-pulse border-b border-slate-100 bg-white p-5 last:border-b-0" key={item}>
          <div className="h-full rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function HistoryPage() {
  const { refresh } = useAuth();
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<CalculationHistoryResponse | null>(null);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        setHistory(await getCalculationHistory(page, PAGE_SIZE, signal));
      } catch (requestError) {
        if (signal?.aborted) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          await refresh().catch(() => undefined);
        }
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Riwayat belum dapat dimuat.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, refresh],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  function changePage(nextPage: number) {
    setSelectedCalculation(null);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[radial-gradient(circle_at_8%_0%,rgba(124,58,237,0.07),transparent_27%),#f8fafc] px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Riwayat Simulasi</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Bandingkan simulasi kampanye yang pernah Anda simpan.</p>
          </div>
          <Link className="brand-gradient-horizontal inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-violet-200 sm:self-auto" to="/"><Plus aria-hidden="true" size={17} /> Simulasi baru</Link>
        </div>

        {loading ? <LoadingHistory /> : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-rose-200 bg-white px-6 py-16 text-center shadow-lg shadow-slate-200/50" role="alert">
            <h2 className="text-xl font-black text-slate-950">Riwayat belum dapat dimuat</h2>
            <p className="mt-2 text-sm text-rose-600">{error}</p>
            <button className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-violet-200" onClick={() => void loadHistory()} type="button">Coba lagi</button>
          </div>
        ) : null}

        {!loading && !error && history?.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-lg shadow-slate-200/40">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-violet-700"><History aria-hidden="true" size={24} /></div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">Belum ada simulasi tersimpan</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Buat proyeksi pertama Anda dan simpan hasilnya agar dapat dibandingkan kembali di sini.</p>
            <Link className="mt-7 inline-flex h-11 items-center rounded-xl bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200" to="/">Mulai menghitung</Link>
          </div>
        ) : null}

        {!loading && !error && history && history.data.length > 0 ? (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <p><span className="font-black text-slate-800">{history.pagination.total}</span> simulasi tersimpan</p>
              <p>Terbaru lebih dahulu</p>
            </div>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40" aria-label="Daftar simulasi tersimpan">
              {history.data.map((calculation) => (
                <HistoryRow calculation={calculation} key={calculation.id} onSelect={setSelectedCalculation} />
              ))}
            </section>
            {history.pagination.totalPages > 1 ? (
              <nav aria-label="Navigasi halaman riwayat" className="mt-7 flex items-center justify-center gap-3">
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-4 focus:ring-violet-100" disabled={page <= 1} onClick={() => changePage(page - 1)} type="button">← Sebelumnya</button>
                <span className="grid h-10 min-w-10 place-items-center rounded-xl bg-violet-600 px-3 text-sm font-black text-white">{page}</span>
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-4 focus:ring-violet-100" disabled={page >= history.pagination.totalPages} onClick={() => changePage(page + 1)} type="button">Berikutnya →</button>
              </nav>
            ) : null}
          </>
        ) : null}
      </div>

      {selectedCalculation ? (
        <SnapshotDrawer calculation={selectedCalculation} onClose={() => setSelectedCalculation(null)} />
      ) : null}
    </main>
  );
}
