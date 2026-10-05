import { useState } from "react";
import { LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/api";
import { Brand } from "./Brand";

export function ProtectedShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error instanceof ApiError ? error.message : "Belum berhasil keluar.");
    } finally {
      setLoggingOut(false);
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-violet-100 ${isActive ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"}`;
  const mobileNavClass = ({ isActive }: { isActive: boolean }) => `${navClass({ isActive })} flex-1 text-center`;
  const userInitials = user?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Brand />
          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 sm:flex">
            <NavLink className={navClass} end to="/">Kalkulator</NavLink>
            <NavLink className={navClass} to="/history">Riwayat</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-white shadow-md shadow-violet-200" aria-hidden="true">
              {userInitials}
            </span>
            <div className="hidden text-right md:block">
              <p className="max-w-44 truncate text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="max-w-44 truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button aria-label="Keluar dari akun" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-slate-100" disabled={loggingOut} onClick={() => void handleLogout()} title="Keluar" type="button">
              {loggingOut ? <span aria-hidden="true">…</span> : <LogOut aria-hidden="true" size={17} strokeWidth={2} />}
            </button>
          </div>
        </div>
        <nav aria-label="Navigasi mobile" className="flex border-t border-slate-100 px-4 py-2 sm:hidden">
          <NavLink className={mobileNavClass} end to="/">Kalkulator</NavLink>
          <NavLink className={mobileNavClass} to="/history">Riwayat</NavLink>
        </nav>
      </header>
      {logoutError ? <div className="mx-auto mt-4 max-w-7xl px-5 sm:px-8"><div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{logoutError}</div></div> : null}
      <Outlet />
    </div>
  );
}
