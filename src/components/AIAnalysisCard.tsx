import { AIAnalysis } from "@/types";
import { Target, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

const SCORE_COLOR: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AIAnalysisCard({ analysis }: { analysis: AIAnalysis }) {
  const painPoints = Array.isArray(analysis.painPoints) ? analysis.painPoints : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-600" /> AI Analysis
        </h3>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            SCORE_COLOR[analysis.leadScore] || SCORE_COLOR.Low
          }`}
        >
          {analysis.leadScore} intent
        </span>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Intent
        </div>
        <p className="text-sm text-slate-700">{analysis.intent}</p>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> Pain Points
        </div>
        <ul className="space-y-1">
          {painPoints.map((point, i) => (
            <li key={i} className="text-sm text-slate-700 flex gap-2">
              <span className="text-brand-500">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" /> Recommended Approach
        </div>
        <p className="text-sm text-slate-700">{analysis.recommendedApproach}</p>
      </div>
    </div>
  );
}
