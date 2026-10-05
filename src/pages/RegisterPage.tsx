import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerInputSchema } from "../../shared/auth";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { ApiError, register } from "../lib/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const parsed = registerInputSchema.safeParse({ name, email, password });
    const nextErrors: Record<string, string> = parsed.success
      ? {}
      : Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
    if (password !== confirmPassword) nextErrors.confirmPassword = "Konfirmasi password belum sama.";
    if (!parsed.success || password !== confirmPassword) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await register(parsed.data);
      navigate("/login", { replace: true, state: { registered: true, email: parsed.data.email } });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields ?? {});
        setSubmitError(error.message);
      } else {
        setSubmitError("Pendaftaran belum berhasil. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-sm font-bold text-violet-600">Mulai analisis Anda</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Buat akun baru</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Simpan proyeksi kampanye dan akses kembali riwayat Anda dengan aman.</p>
      </div>
      {submitError ? <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{submitError}</div> : null}
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormField autoComplete="name" error={errors.name} label="Nama lengkap" onChange={(event) => setName(event.target.value)} placeholder="Nama Anda" type="text" value={name} />
        <FormField autoComplete="email" error={errors.email} label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" type="email" value={email} />
        <FormField autoComplete="new-password" error={errors.password} hint="Minimal 8 karakter." label="Password" onChange={(event) => setPassword(event.target.value)} placeholder="Buat password" type="password" value={password} />
        <FormField autoComplete="new-password" error={errors.confirmPassword} label="Konfirmasi password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ulangi password" type="password" value={confirmPassword} />
        <button className="brand-gradient-horizontal flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus:outline-none focus:ring-4 focus:ring-violet-200" disabled={submitting} type="submit">
          {submitting ? "Membuat akun..." : "Buat akun"}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-600">Sudah memiliki akun? <Link className="font-bold text-violet-700 hover:text-violet-900" to="/login">Masuk di sini</Link></p>
    </AuthLayout>
  );
}
