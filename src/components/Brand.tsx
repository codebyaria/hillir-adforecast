import { Link } from "react-router-dom";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className="inline-flex items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-200" to="/">
      <span className="brand-gradient grid h-10 w-10 place-items-center rounded-xl shadow-lg shadow-violet-500/20">
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path d="M5 17V11M12 17V7M19 17V4" stroke="white" strokeLinecap="round" strokeWidth="2.25" />
          <path d="m4 7 4-3 4 2 7-4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
        </svg>
      </span>
      <span>
        <span className={`block text-base font-black leading-none ${inverse ? "text-white" : "text-slate-950"}`}>AdForecast Pro</span>
        <span className={`mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] ${inverse ? "text-white/70" : "text-slate-600"}`}>Campaign intelligence</span>
      </span>
    </Link>
  );
}
