"use client";

import { PriorityEntry } from "@/lib/types";
import { detectExpansionSignals } from "@/lib/alerts";

interface Props {
  entries: PriorityEntry[];
}

export default function ExpansionDetection({ entries }: Props) {
  const opportunities = entries
    .map((e) => ({
      account: e.account,
      mrr: e.account.mrr,
      signals: detectExpansionSignals(e.account),
    }))
    .filter((o) => o.signals.length > 0)
    .sort((a, b) => b.mrr - a.mrr);

  if (opportunities.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Détection d&apos;opportunités d&apos;expansion
        </h2>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-500 text-sm">
          Aucun signal d&apos;expansion détecté aujourd&apos;hui.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
        Détection d&apos;opportunités d&apos;expansion ({opportunities.length})
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {opportunities.map(({ account, signals }) => {
          const mrrFormatted = new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(account.mrr);

          return (
            <div
              key={account.id}
              className="bg-white border border-blue-100 rounded-2xl px-5 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{account.name}</p>
                  <p className="text-xs text-slate-400">{account.tier} · {mrrFormatted}/mo</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 ring-1 ring-blue-200 rounded-full font-medium">
                  {signals.length} signal{signals.length > 1 ? "s" : ""}
                </span>
              </div>
              <ul className="space-y-1.5">
                {signals.map((signal, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-blue-400 shrink-0 mt-0.5">↑</span>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
