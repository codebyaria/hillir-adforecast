import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginInputSchema } from "../../shared/auth";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { ApiError } from "../lib/api";

interface LoginLocationState {
  from?: { pathname?: string; search?: string };
  registered?: boolean;
  email?: string;
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const state = (location.state ?? {}) as LoginLocationState;
  const [email, setEmail] = useState(state.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const parsed = loginInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data);
      const destination = `${state.from?.pathname ?? "/"}${state.from?.search ?? ""}`;
      navigate(destination, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Belum berhasil masuk. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-sm font-bold text-violet-600">Selamat datang kembali</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Masuk ke akun Anda</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Lanjutkan analisis dan lihat kembali proyeksi kampanye Anda.</p>
      </div>
      {state.registered ? <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">Akun berhasil dibuat. Silakan masuk dengan password Anda.</div> : null}
      {submitError ? <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{submitError}</div> : null}
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <FormField autoComplete="email" error={errors.email} label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" type="email" value={email} />
        <FormField autoComplete="current-password" error={errors.password} label="Password" onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" type="password" value={password} />
        <button className="brand-gradient-horizontal flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-4 focus:ring-violet-200" disabled={submitting} type="submit">
          {submitting ? "Memproses..." : "Masuk"}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-600">Belum memiliki akun? <Link className="font-bold text-violet-700 hover:text-violet-900" to="/register">Daftar sekarang</Link></p>
    </AuthLayout>
  );
}
