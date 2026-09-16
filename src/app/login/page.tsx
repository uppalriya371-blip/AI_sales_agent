"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email, name, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError("Sign-in failed. Please try again.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-center">
        <div className="rounded-[32px] glass-panel p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered pipeline
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Turn inbound leads into warm outreach faster.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Analyze intent, prioritize opportunities, and draft polished Gmail replies in seconds.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Lead score", value: "92%" },
              { label: "Draft time", value: "12 sec" },
              { label: "Reply quality", value: "A+" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-[28px] p-6 md:p-8 shadow-[0_24px_50px_rgba(15,23,42,0.12)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">AI Sales Agent</div>
              <div className="text-xs text-slate-500">Sales team workspace</div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-5">Sign in with your work email to access the dashboard.</p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="Your full name"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {busy ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secure internal access only
          </div>
        </form>
      </div>
    </div>
  );
}
