"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lead } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Loader2, RefreshCcw } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  ANALYZED: "bg-blue-100 text-blue-700",
  EMAIL_DRAFTED: "bg-amber-100 text-amber-700",
  DRAFT_CREATED: "bg-emerald-100 text-emerald-700",
  SENT: "bg-purple-100 text-purple-700",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

const SCORE_STYLES: Record<string, string> = {
  High: "text-emerald-600",
  Medium: "text-amber-600",
  Low: "text-slate-400",
};

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLeads() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
        <button
          onClick={loadLeads}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No leads yet. New submissions to <code>/api/leads</code> will show up here.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Job Title</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <Link href={`/leads/${lead.id}`} className="block">
                      <div className="font-medium text-slate-900">{lead.name}</div>
                      <div className="text-slate-400 text-xs">{lead.email}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{lead.company || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{lead.jobTitle || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{lead.source}</td>
                  <td className={`px-5 py-3 font-medium ${SCORE_STYLES[lead.analysis?.leadScore || ""] || "text-slate-400"}`}>
                    {lead.analysis?.leadScore || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[lead.status]}`}>
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
