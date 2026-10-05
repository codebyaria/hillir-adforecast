import { useId, useState, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, error, hint, type, ...props }: FormFieldProps) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={`h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:border-violet-500 focus:ring-violet-100"} ${isPassword ? "pr-12" : ""}`}
          id={id}
          type={isPassword && showPassword ? "text" : type}
        />
        {isPassword ? (
          <button
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-2 my-auto grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? (
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="m3 3 18 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.6 4.6 9.5 6a1.7 1.7 0 0 1 0 2c-.4.6-1.2 1.7-2.4 2.8M6.2 6.2C4.3 7.5 3 9.3 2.5 10a1.7 1.7 0 0 0 0 2c.9 1.4 4.3 6 9.5 6 1.2 0 2.3-.2 3.3-.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="M2.5 10a1.7 1.7 0 0 0 0 2c.9 1.4 4.3 6 9.5 6s8.6-4.6 9.5-6a1.7 1.7 0 0 0 0-2C20.6 8.6 17.2 4 12 4s-8.6 4.6-9.5 6Z" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600" id={`${id}-error`}>{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-xs text-slate-500" id={`${id}-hint`}>{hint}</p> : null}
    </div>
  );
}
