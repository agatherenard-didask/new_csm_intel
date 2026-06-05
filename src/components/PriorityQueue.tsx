"use client";

import { useState } from "react";
import { PriorityEntry } from "@/lib/types";
import ScoreBadge from "./ScoreBadge";

interface Props {
  entries: PriorityEntry[];
}

const SEGMENT_LABELS: Record<PriorityEntry["segment"], string> = {
  churn_risk: "Risque churn",
  adoption_issue: "Adoption",
  expansion: "Expansion",
  onboarding: "Onboarding",
  healthy: "Sain",
};

const SEGMENT_COLORS: Record<PriorityEntry["segment"], string> = {
  churn_risk: "bg-red-50 text-red-700 ring-red-200",
  adoption_issue: "bg-amber-50 text-amber-700 ring-amber-200",
  expansion: "bg-blue-50 text-blue-700 ring-blue-200",
  onboarding: "bg-purple-50 text-purple-700 ring-purple-200",
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const TIER_COLORS: Record<string, string> = {
  Premium: "bg-violet-100 text-violet-700",
  Standard: "bg-slate-100 text-slate-600",
  Light: "bg-sky-100 text-sky-700",
};

type Filter = PriorityEntry["segment"] | "all";

export default function PriorityQueue({ entries }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = filter === "all" ? entries : entries.filter((e) => e.segment === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "churn_risk", label: "Risque churn" },
    { key: "adoption_issue", label: "Adoption" },
    { key: "onboarding", label: "Onboarding" },
    { key: "expansion", label: "Expansion" },
    { key: "healthy", label: "Sains" },
  ];

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          File de priorité
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === f.key
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((entry, i) => {
          const mrrFormatted = new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(entry.account.mrr);

          return (
            <div
              key={entry.account.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Rank */}
              <span className="text-2xl font-bold text-slate-200 w-8 shrink-0 hidden sm:block">
                {i + 1}
              </span>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{entry.account.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[entry.account.tier]}`}>
                    {entry.account.tier}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ring-1 font-medium ${SEGMENT_COLORS[entry.segment]}`}>
                    {SEGMENT_LABELS[entry.segment]}
                  </span>
                  {entry.account.touchModel === "high" ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                      High Touch
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                      Low Touch
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{entry.account.csm}</span>
                </div>
                <p className="text-sm text-slate-500 truncate">{entry.mainReason}</p>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-slate-400">ARR</p>
                  <p className="text-sm font-semibold text-slate-700">{mrrFormatted}/mo</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Santé</p>
                  <ScoreBadge score={entry.healthScore} positive />
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Priorité</p>
                  <ScoreBadge score={entry.priorityScore} />
                </div>
              </div>

              {/* Action */}
              <div className="sm:w-56 shrink-0">
                <p className="text-xs text-slate-400 mb-1">Action suggérée</p>
                <p className="text-xs text-slate-600 leading-snug">{entry.suggestedAction}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
