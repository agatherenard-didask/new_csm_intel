"use client";

import { PriorityEntry } from "@/lib/types";

interface Props {
  entries: PriorityEntry[];
}

export default function TouchSuggestions({ entries }: Props) {
  const suggestions = entries.filter((e) => e.touchSuggestion !== null);

  if (suggestions.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Suggestions de reclassification HT / LT
      </h2>
      <div className="space-y-2">
        {suggestions.map((e) => {
          const toHigh = e.touchSuggestion === "suggest_high";
          const mrrFormatted = new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(e.account.mrr);

          const nonExpAlerts = e.alerts.filter((a) => a.category !== "expansion");
          const criticalCount = nonExpAlerts.filter((a) => a.severity === "critical").length;

          const reason = toHigh
            ? criticalCount > 0
              ? `${criticalCount} alerte(s) critique(s) — suivi renforcé recommandé`
              : `${nonExpAlerts.length} alertes actives — dépasse le seuil Low Touch`
            : `Compte stable depuis 30+ jours — pas d'alerte critique`;

          return (
            <div
              key={e.account.id}
              className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                toHigh
                  ? "bg-amber-50 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{e.account.name}</span>
                  <span className="text-xs text-slate-400">{mrrFormatted}/mo · {e.account.csm}</span>
                  {/* Current badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ring-1 ${
                    e.account.touchModel === "high"
                      ? "bg-amber-100 text-amber-700 ring-amber-200"
                      : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}>
                    {e.account.touchModel === "high" ? "High Touch" : "Low Touch"} actuel
                  </span>
                </div>
                <p className="text-xs text-slate-500">{reason}</p>
              </div>

              <div className={`shrink-0 flex items-center gap-2 text-sm font-semibold ${
                toHigh ? "text-amber-700" : "text-slate-600"
              }`}>
                <span className="text-slate-400 text-xs font-normal">
                  {toHigh ? "Low Touch" : "High Touch"}
                </span>
                <span>→</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  toHigh
                    ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                    : "bg-slate-200 text-slate-700 ring-1 ring-slate-300"
                }`}>
                  {toHigh ? "⬆ Envisager High Touch ?" : "⬇ Envisager Low Touch ?"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
