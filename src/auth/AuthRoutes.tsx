import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

function SessionScreen({ failed = false }: { failed?: boolean }) {
  const { refresh } = useAuth();

  if (!failed) {
    return (
      <main className="grid min-h-screen place-items-center overflow-hidden bg-[#f7f8fc]" role="status">
        <div className="relative grid place-items-center">
          <div aria-hidden="true" className="session-loader-glow absolute h-32 w-32 rounded-full bg-violet-300/25 blur-3xl" />
          <div className="relative grid h-24 w-24 place-items-center">
            <span aria-hidden="true" className="session-loader-ring absolute h-16 w-16 rounded-3xl border border-violet-300/70" />
            <div className="brand-gradient session-loader-mark relative grid h-14 w-14 place-items-center rounded-2xl shadow-xl shadow-violet-300/40">
              <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
                <path d="M5 17V11M12 17V7M19 17V4" stroke="white" strokeLinecap="round" strokeWidth="2.25" />
                <path d="m4 7 4-3 4 2 7-4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
              </svg>
            </div>
          </div>
          <div aria-hidden="true" className="mt-3 h-1 w-16 overflow-hidden rounded-full bg-slate-200">
            <div className="brand-gradient-horizontal session-loader-shimmer h-full w-7 rounded-full" />
          </div>
          <span className="sr-only">Memuat</span>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <div className="text-center" role="alert">
        <div className="brand-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl shadow-lg shadow-violet-200">
          <span className="text-xl font-black text-white">A</span>
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-950">Sesi belum dapat diperiksa</h1>
        <p className="mt-2 text-sm text-slate-500">Periksa koneksi Anda, lalu coba kembali.</p>
        <button className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-violet-200" onClick={() => void refresh().catch(() => undefined)} type="button">
          Coba lagi
        </button>
      </div>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <SessionScreen />;
  if (status === "error") return <SessionScreen failed />;
  if (status === "unauthenticated") return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <SessionScreen />;
  if (status === "error") return <SessionScreen failed />;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return children;
}
