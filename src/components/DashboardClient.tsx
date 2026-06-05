"use client";

import { useState } from "react";
import { PriorityEntry, PortfolioStats } from "@/lib/types";
import { buildPortfolioStats } from "@/lib/priority";
import PortfolioOverview from "./PortfolioOverview";
import PriorityQueue from "./PriorityQueue";
import RiskDetection from "./RiskDetection";
import ExpansionDetection from "./ExpansionDetection";
import OnboardingMonitoring from "./OnboardingMonitoring";

const CSM_LIST = ["Tous", "Agathe", "Adeline", "Antoine", "Charles"] as const;
type CsmFilter = (typeof CSM_LIST)[number];

interface Props {
  allEntries: PriorityEntry[];
  today: string;
}

export default function DashboardClient({ allEntries, today }: Props) {
  const [csmFilter, setCsmFilter] = useState<CsmFilter>("Tous");

  const entries =
    csmFilter === "Tous"
      ? allEntries
      : allEntries.filter((e) => e.account.csm === csmFilter);

  const stats: PortfolioStats = buildPortfolioStats(entries);

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

          {/* CSM filter */}
          <div className="flex items-center gap-2">
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
            <PortfolioOverview stats={stats} />
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
