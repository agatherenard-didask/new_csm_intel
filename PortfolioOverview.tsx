"use client";

import { PortfolioStats } from "@/lib/types";

interface Props {
  stats: PortfolioStats;
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "yellow" | "blue";
}) {
  const colors: Record<string, string> = {
    green: "text-emerald-600",
    red: "text-red-500",
    yellow: "text-amber-500",
    blue: "text-blue-600",
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? colors[accent] : "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function PortfolioOverview({ stats }: Props) {
  const arrFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(stats.totalARR);

  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Vue portefeuille
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat label="Comptes" value={stats.totalAccounts} />
        <Stat label="ARR total" value={arrFormatted} accent="blue" />
        <Stat label="Santé moyenne" value={`${stats.avgHealthScore}/100`} accent="blue" />
        <Stat
          label="En bonne santé"
          value={stats.healthyCount}
          sub={`${Math.round((stats.healthyCount / stats.totalAccounts) * 100)}% du portefeuille`}
          accent="green"
        />
        <Stat label="À risque" value={stats.atRiskCount} accent="red" />
      </div>
    </section>
  );
}
