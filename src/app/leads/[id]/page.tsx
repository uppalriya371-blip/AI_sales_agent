"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lead } from "@/types";
import AIAnalysisCard from "@/components/AIAnalysisCard";
import EmailEditor from "@/components/EmailEditor";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Lead not found");
      const data = await res.json();
      setLead(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to analyze lead");
      await loadLead();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading lead…
      </div>
    );
  }

  if (!lead) {
    return <div className="p-8 text-red-600 text-sm">{error || "Lead not found"}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to leads
      </button>

      {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">{lead.name}</h2>
            <p className="text-sm text-slate-500">{lead.email}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Company</dt>
                <dd className="text-slate-700">{lead.company || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Job Title</dt>
                <dd className="text-slate-700">{lead.jobTitle || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Source</dt>
                <dd className="text-slate-700">{lead.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Received</dt>
                <dd className="text-slate-700">
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </dd>
              </div>
            </dl>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-400 mb-1">Message</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.message}</p>
            </div>
          </div>

          {!lead.analysis && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze Lead with AI
            </button>
          )}

          {lead.analysis && <AIAnalysisCard analysis={lead.analysis} />}
        </div>

        {/* Email preview / editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Email Preview</h3>
            <EmailEditor lead={lead} onUpdated={loadLead} />
          </div>
        </div>
      </div>
    </div>
  );
}
