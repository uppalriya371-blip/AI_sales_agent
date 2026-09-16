"use client";

import { useState } from "react";
import { Lead } from "@/types";
import { Loader2, Sparkles, Copy, Send, Check } from "lucide-react";

export default function EmailEditor({ lead, onUpdated }: { lead: Lead; onUpdated: () => void }) {
  const analysis = lead.analysis;
  const existingDraft = lead.emailDrafts?.[0];

  const [subject, setSubject] = useState(analysis?.emailSubject || "");
  const [body, setBody] = useState(analysis?.emailBody || "");
  const [regenerateNote, setRegenerateNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRegenerate() {
    setBusy("regenerate");
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: regenerateNote || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to regenerate email");
      const data = await res.json();
      setSubject(data.analysis.emailSubject);
      setBody(data.analysis.emailBody);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateOrUpdateDraft() {
    setBusy("draft");
    setError(null);
    try {
      if (existingDraft) {
        const res = await fetch("/api/gmail/update-draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId: existingDraft.id, subject, body }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update draft");
      } else {
        const res = await fetch("/api/gmail/create-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead.id }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create draft");
      }
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!analysis) {
    return (
      <div className="text-sm text-slate-400 py-6 text-center">
        Analyze this lead first to generate an email.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <input
          value={regenerateNote}
          onChange={(e) => setRegenerateNote(e.target.value)}
          placeholder="Optional: tell the AI how to adjust it (e.g. 'shorter, more formal')"
          className="flex-1 min-w-[220px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleRegenerate}
          disabled={busy !== null}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          {busy === "regenerate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Regenerate
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={handleCreateOrUpdateDraft}
          disabled={busy !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy === "draft" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {existingDraft ? "Update Gmail Draft" : "Create Gmail Draft"}
        </button>
        {existingDraft && (
          <a
            href="https://mail.google.com/mail/u/0/#drafts"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-600 hover:underline px-2"
          >
            Open Gmail →
          </a>
        )}
      </div>

      <p className="text-xs text-slate-400 pt-2">
        This creates a draft only — nothing is sent automatically. Review it in Gmail before sending.
      </p>
    </div>
  );
}
