"use client";

import { useMemo, useState } from "react";
import { PriorityEntry } from "@/lib/types";
import { daysToDate, getHealthScoreDetails } from "@/lib/scoring";
import { detectExpansionSignals } from "@/lib/alerts";

interface Props {
  entries: PriorityEntry[];
  onSelect: (entry: PriorityEntry) => void;
}

type SortKey =
  | "name"
  | "health"
  | "churn"
  | "renewal"
  | "meet"
  | "interaction"
  | "content"
  | "priority";

const TIER_STYLES: Record<string, string> = {
  Premium: "bg-violet-100 text-violet-700",
  Standard: "bg-slate-100 text-slate-700",
  Light: "bg-sky-100 text-sky-700",
};

const TIER_THRESHOLD: Record<string, number> = {
  Premium: 30,
  Standard: 90,
  Light: 365,
};

function npsStyle(nps: number): string {
  if (nps >= 50) return "bg-green-100 text-green-700";
  if (nps >= 30) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function healthBar(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function daysAgo(isoDate: string | null): number | null {
  if (!isoDate) return null;
  return Math.round((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

function interactionColor(days: number): string {
  if (days <= 7) return "text-emerald-600";
  if (days <= 30) return "text-amber-600";
  return "text-red-600";
}

function churnBar(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-slate-400";
}

function statusFor(entry: PriorityEntry): { label: string; cls: string; dot: string } {
  const { churnRisk, healthScore, account } = entry;
  if (churnRisk.total >= 70) return { label: "Critique", cls: "bg-red-100 text-red-700", dot: "bg-red-500" };
  if (churnRisk.total >= 40 || healthScore < 55)
    return { label: "Vigilance", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
  if (detectExpansionSignals(account).length > 0)
    return { label: "Expansion", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
  return { label: "Sain", cls: "bg-green-100 text-green-700", dot: "bg-green-500" };
}

export default function AccountTable({ entries, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.account.name.localeCompare(b.account.name);
          break;
        case "health":
          cmp = a.healthScore - b.healthScore;
          break;
        case "churn":
          cmp = a.churnRisk.total - b.churnRisk.total;
          break;
        case "renewal":
          cmp = a.churnRisk.daysToRenewal - b.churnRisk.daysToRenewal;
          break;
        case "meet":
          cmp = a.account.meet - b.account.meet;
          break;
        case "interaction": {
          const da = daysAgo(a.account.lastInteractionDate) ?? 9999;
          const db = daysAgo(b.account.lastInteractionDate) ?? 9999;
          cmp = da - db;
          break;
        }
        case "content":
          cmp = a.account.contentCreationCount - b.account.contentCreationCount;
          break;
        case "priority":
          cmp = a.priorityScore - b.priorityScore;
          break;
      }
      return asc ? cmp : -cmp;
    });
    return copy;
  }, [entries, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      setAsc(false);
    }
  }

  const headers: { label: string; key?: SortKey }[] = [
    { label: "Client", key: "name" },
    { label: "Tier / Équipe" },
    { label: "Health Score", key: "health" },
    { label: "Risque Churn", key: "churn" },
    { label: "Fin de contrat", key: "renewal" },
    { label: "Dernier RDV", key: "meet" },
    { label: "Dernière interaction", key: "interaction" },
    { label: "Activité création", key: "content" },
    { label: "Statut" },
    { label: "Alertes" },
    { label: "" },
  ];

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
        Aucun compte dans cette catégorie.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1100px] border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {headers.map((h, i) => (
              <th
                key={i}
                onClick={h.key ? () => toggleSort(h.key as SortKey) : undefined}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                  h.key ? "cursor-pointer select-none hover:text-slate-600" : ""
                }`}
              >
                {h.label}
                {h.key && sortKey === h.key && (
                  <span className="ml-1">{asc ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const a = entry.account;
            const d = getHealthScoreDetails(a);
            const finDays = daysToDate(a.end);
            const status = statusFor(entry);
            const threshold = TIER_THRESHOLD[a.tier] ?? 90;
            const nonExpAlerts = entry.alerts.filter((al) => al.category !== "expansion");
            const criticalAlerts = nonExpAlerts.filter((al) => al.severity === "critical");

            return (
              <tr
                key={a.id}
                onClick={() => onSelect(entry)}
                className="cursor-pointer border-b border-slate-100 bg-white hover:bg-slate-50"
              >
                {/* CLIENT */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{a.name}</span>
                    {a.nps !== null && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${npsStyle(a.nps)}`}>
                        NPS {a.nps}
                      </span>
                    )}
                  </div>
                </td>

                {/* TIER / ÉQUIPE */}
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_STYLES[a.tier]}`}>
                    {a.tier}
                  </span>
                  <div className="mt-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        a.touchModel === "high"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {a.touchModel === "high" ? "HT" : "LT"}
                    </span>
                  </div>
                </td>

                {/* HEALTH SCORE */}
                <td className="px-4 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-slate-900">{entry.healthScore}</span>
                    <span className="text-xs text-slate-400">/100</span>
                    <span
                      className={`ml-1 text-xs font-semibold ${
                        a.trend >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {a.trend >= 0 ? "↑" : "↓"}
                      {Math.abs(a.trend)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${healthBar(entry.healthScore)}`}
                      style={{ width: `${entry.healthScore}%` }}
                    />
                  </div>
                </td>

                {/* RISQUE CHURN */}
                <td className="px-4 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-slate-900">{entry.churnRisk.total}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                  <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${churnBar(entry.churnRisk.total)}`}
                      style={{ width: `${entry.churnRisk.total}%` }}
                    />
                  </div>
                </td>

                {/* FIN DE CONTRAT */}
                <td className="px-4 py-4">
                  <div className="text-sm text-slate-700">{a.end}</div>
                  <div
                    className={`mt-0.5 text-xs font-medium ${
                      finDays <= 0
                        ? "text-red-600"
                        : finDays <= 30
                        ? "text-red-600"
                        : finDays <= 120
                        ? "text-orange-500"
                        : "text-green-600"
                    }`}
                  >
                    {finDays <= 0 ? "Expiré" : `${finDays}j restants`}
                  </div>
                </td>

                {/* DERNIER RDV */}
                <td className="px-4 py-4">
                  <span className={`text-sm font-medium ${a.meet > threshold ? "text-red-600" : "text-slate-700"}`}>
                    {a.meet}j
                  </span>
                  <span className="ml-1 text-xs text-slate-400">· seuil {threshold}j</span>
                </td>

                {/* DERNIÈRE INTERACTION */}
                <td className="px-4 py-4">
                  {(() => {
                    const d = daysAgo(a.lastInteractionDate);
                    if (d === null) return <span className="text-xs text-slate-300">—</span>;
                    return (
                      <span className={`text-sm font-medium ${interactionColor(d)}`}>
                        il y a {d}j
                      </span>
                    );
                  })()}
                </td>

                {/* ACTIVITÉ CRÉATION */}
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-slate-700">{a.contentCreationCount}</span>
                  <span className="ml-1 text-xs text-slate-400">/30j</span>
                </td>

                {/* STATUT */}
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </td>

                {/* ALERTES */}
                <td className="px-4 py-4">
                  {nonExpAlerts.length === 0 ? (
                    <span className="text-xs text-slate-300">—</span>
                  ) : (
                    <span className="text-sm font-semibold">
                      {criticalAlerts.length > 0 && (
                        <span className="text-red-600">{criticalAlerts.length}</span>
                      )}
                      {criticalAlerts.length > 0 && <span className="text-slate-300"> / </span>}
                      <span className="text-slate-600">{nonExpAlerts.length}</span>
                    </span>
                  )}
                </td>

                {/* DÉTAILS */}
                <td className="px-4 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(entry);
                    }}
                    className="whitespace-nowrap rounded-lg bg-[#f9b494] px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-[#f7a07e]"
                  >
                    Détails →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
