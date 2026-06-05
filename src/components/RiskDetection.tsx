"use client";

import { Alert, AlertCategory, AlertSeverity } from "@/lib/types";
import { PriorityEntry } from "@/lib/types";

interface Props {
  entries: PriorityEntry[];
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: "border-l-red-500 bg-red-50",
  warning: "border-l-amber-400 bg-amber-50",
  info: "border-l-blue-400 bg-blue-50",
};

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "Critique",
  warning: "Attention",
  info: "Info",
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  adoption: "Adoption",
  stakeholder: "Relation",
  renewal: "Renouvellement",
  expansion: "Expansion",
  onboarding: "Onboarding",
};

function AlertCard({ alert, accountName }: { alert: Alert; accountName: string }) {
  return (
    <div className={`border-l-4 rounded-r-xl px-4 py-3 ${SEVERITY_STYLES[alert.severity]}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${SEVERITY_DOT[alert.severity]}`} />
          <span className="font-semibold text-sm text-slate-800">{alert.title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-slate-400">{accountName}</span>
          <span className="text-xs px-1.5 py-0.5 bg-white rounded-md text-slate-500 ring-1 ring-slate-200">
            {CATEGORY_LABELS[alert.category]}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500 ml-4 mb-2">{alert.detail}</p>
      <p className="text-xs text-slate-600 ml-4 font-medium">→ {alert.suggestedAction}</p>
    </div>
  );
}

const ORDER: AlertSeverity[] = ["critical", "warning", "info"];

export default function RiskDetection({ entries }: Props) {
  const allAlerts = entries.flatMap((e) =>
    e.alerts
      .filter((a) => a.category !== "expansion")
      .map((a) => ({ alert: a, accountName: e.account.name }))
  );

  const sorted = [...allAlerts].sort(
    (a, b) => ORDER.indexOf(a.alert.severity) - ORDER.indexOf(b.alert.severity)
  );

  const critical = sorted.filter((a) => a.alert.severity === "critical");
  const warning = sorted.filter((a) => a.alert.severity === "warning");
  const info = sorted.filter((a) => a.alert.severity === "info");

  if (sorted.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Détection des risques
        </h2>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-emerald-700 text-sm">
          Aucune alerte active — portefeuille sain.
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Détection des risques
        </h2>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{critical.length} critique(s)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{warning.length} attention</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{info.length} info</span>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map(({ alert, accountName }) => (
          <AlertCard key={alert.id} alert={alert} accountName={accountName} />
        ))}
      </div>
    </section>
  );
}
