"use client";

import { useEffect, useState } from "react";
import { Mail, CheckCircle2, XCircle } from "lucide-react";

export default function SettingsPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail_connected")) {
      setConnected(true);
      setMessage("Gmail connected successfully.");
    }
    if (params.get("gmail_error")) {
      setMessage(`Gmail connection failed: ${params.get("gmail_error")}`);
    }
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Settings</h1>

      <div id="account" className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Gmail Connection</h2>
            <p className="text-xs text-slate-500">
              Required to create email drafts directly in your inbox.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
              connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {connected ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {message}
          </div>
        )}

        <a
          href="/api/auth/gmail"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700"
        >
          Connect Gmail Account
        </a>

        <p className="text-xs text-slate-400 mt-4">
          This app only requests the <code>gmail.compose</code> scope — it can create and edit
          drafts, but cannot read your inbox or send email on your behalf.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Account</h2>
        <p className="text-sm text-slate-600">
          This is the settings section the sidebar links to.
        </p>
      </div>
    </div>
  );
}
