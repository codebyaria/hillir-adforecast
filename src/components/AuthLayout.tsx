import type { ReactNode } from "react";

import { Brand } from "./Brand";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950 lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(520px,0.95fr)] lg:overflow-hidden">
      <section className="relative hidden h-screen overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute inset-0 auth-grid opacity-30" />
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative"><Brand inverse /></div>
        <div className="relative flex flex-1 items-center py-8 xl:py-12">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-violet-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
              Prediksi berbasis data, keputusan lebih percaya diri
            </div>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl 2xl:text-6xl">
              Ubah data kampanye menjadi
              <span className="brand-gradient-horizontal block bg-clip-text text-transparent">keputusan yang tajam.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 xl:text-lg xl:leading-8">Hitung proyeksi ROI, simpan setiap skenario, dan evaluasi performa iklan dalam satu ruang kerja.</p>
            <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
              {[["Real-time", "Kalkulasi"], ["Terukur", "Wawasan"], ["Aman", "Riwayat"]].map(([value, label]) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur" key={value}>
                  <p className="font-bold text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:px-12">
        <div className="w-full max-w-md"><div className="mb-10 lg:hidden"><Brand /></div>{children}</div>
      </section>
    </main>
  );
}
