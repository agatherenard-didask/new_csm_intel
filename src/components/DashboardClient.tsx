"use client";

import { useState, useMemo } from "react";
import { PriorityEntry, PortfolioStats, CsmCapacity } from "@/lib/types";
import { buildPortfolioStats, buildCsmCapacities } from "@/lib/priority";
import PortfolioOverview from "./PortfolioOverview";
import PriorityQueue from "./PriorityQueue";
import RiskDetection from "./RiskDetection";
import ExpansionDetection from "./ExpansionDetection";
import OnboardingMonitoring from "./OnboardingMonitoring";
import BatchBlock from "./BatchBlock";
import TouchSuggestions from "./TouchSuggestions";

const CSM_LIST = ["Tous", "Agathe", "Adeline", "Antoine", "Charles"] as const;
type CsmFilter = (typeof CSM_LIST)[number];

interface Props {
  allEntries: PriorityEntry[];
  today: string;
}

function CapacityPill({ cap }: { cap: CsmCapacity }) {
  const htPct = Math.min((cap.htCount / cap.htMax) * 100, 100);
  const ltPct = Math.min((cap.ltCount / cap.ltMax) * 100, 100);
  const htOver = cap.htCount > cap.htMax;
  const ltOver = cap.ltCount > cap.ltMax;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs space-y-2">
      <p className="font-semibold text-slate-700">{cap.csm}</p>
      {/* High Touch bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className={htOver ? "text-red-600 font-medium" : "text-amber-700"}>
            High Touch
          </span>
          <span className={htOver ? "text-red-600 font-bold" : "text-slate-600"}>
            {cap.htCount}/{cap.htMax}
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${htOver ? "bg-red-400" : "bg-amber-400"}`}
            style={{ width: `${htPct}%` }}
          />
        </div>
      </div>
      {/* Low Touch bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className={ltOver ? "text-red-600 font-medium" : "text-slate-500"}>
            Low Touch
          </span>
          <span className={ltOver ? "text-red-600 font-bold" : "text-slate-600"}>
            {cap.ltCount}/{cap.ltMax}
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${ltOver ? "bg-red-400" : "bg-slate-400"}`}
            style={{ width: `${ltPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({ allEntries, today }: Props) {
  const [csmFilter, setCsmFilter] = useState<CsmFilter>("Tous");

  const entries = useMemo(
    () =>
      csmFilter === "Tous"
        ? allEntries
        : allEntries.filter((e) => e.account.csm === csmFilter),
    [allEntries, csmFilter]
  );

  const stats: PortfolioStats = useMemo(() => buildPortfolioStats(entries), [entries]);

  // Capacities always computed from the full portfolio (per CSM, not filtered)
  const allCapacities = useMemo(() => buildCsmCapacities(allEntries), [allEntries]);

  // When a specific CSM is selected, show only their capacity card
  const visibleCapacities =
    csmFilter === "Tous"
      ? allCapacities
      : allCapacities.filter((c) => c.csm === csmFilter);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#1a1a1a] tracking-tight">
              Didask <span className="text-[#f9b494]">CSM</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 border border-slate-200 rounded-full px-2.5 py-0.5">
              Intelligence Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 shrink-0">CSM :</span>
            <div className="flex flex-wrap gap-1.5">
              {CSM_LIST.map((csm) => (
                <button
                  key={csm}
                  onClick={() => setCsmFilter(csm)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    csmFilter === csm
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {csm}
                </button>
              ))}
            </div>
            <div className="hidden sm:block text-xs text-slate-400 capitalize ml-2">{today}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-10 text-center text-slate-400 text-sm">
            Aucun compte pour ce CSM.
          </div>
        ) : (
          <>
            {/* Capacity cards */}
            {visibleCapacities.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Capacité portefeuille
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {visibleCapacities.map((cap) => (
                    <CapacityPill key={cap.csm} cap={cap} />
                  ))}
                </div>
              </section>
            )}

            <PortfolioOverview stats={stats} />
            <BatchBlock entries={entries} />
            <TouchSuggestions entries={entries} />
            <PriorityQueue entries={entries} />
            <RiskDetection entries={entries} />
            <ExpansionDetection entries={entries} />
            <OnboardingMonitoring entries={entries} />
          </>
        )}
      </main>

      <footer className="text-center text-xs text-slate-300 py-8">
        Didask CSM Dashboard · données mock MVP
      </footer>
    </>
  );
}
