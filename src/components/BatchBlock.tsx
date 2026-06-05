"use client";

import { useState } from "react";
import { PriorityEntry, AlertSeverity } from "@/lib/types";

interface Props {
  entries: PriorityEntry[];
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

const SEVERITY_STYLES: Record<AlertSeverity, { bar: string; badge: string; label: string }> = {
  critical: {
    bar: "border-l-red-500 bg-red-50",
    badge: "bg-red-100 text-red-700",
    label: "Critique",
  },
  warning: {
    bar: "border-l-amber-400 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    label: "Attention",
  },
  info: {
    bar: "border-l-blue-400 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    label: "Info",
  },
};

interface BatchItem {
  key: string;
  accountName: string;
  accountId: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  suggestedAction: string;
  mrrFormatted: string;
}

export default function BatchBlock({ entries }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Build one item per (LT account × top alert), sorted by severity then priority score
  const ltEntries = entries.filter((e) => e.account.touchModel === "low");

  const items: BatchItem[] = ltEntries
    .flatMap((e) => {
      const nonExpAlerts = e.alerts.filter((a) => a.category !== "expansion");
      if (nonExpAlerts.length === 0) return [];
      // Take the top alert (most severe)
      const top = [...nonExpAlerts].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      )[0];
      const mrrFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(e.account.mrr);
      return [
        {
          key: `${e.account.id}-${top.id}`,
          accountName: e.account.name,
          accountId: e.account.id,
          severity: top.severity,
          title: top.title,
          detail: top.detail,
          suggestedAction: e.suggestedAction,
          mrrFormatted,
        },
      ];
    })
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );

  const pending = items.filter((i) => !done.has(i.key));
  const completed = items.filter((i) => done.has(i.key));

  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Mon bloc du jour — Low Touch
        </h2>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-emerald-700 text-sm">
          Aucun signal Low Touch à traiter aujourd&apos;hui. ✓
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Mon bloc du jour — Low Touch
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Signaux à traiter en batch · {pending.length} restant{pending.length !== 1 ? "s" : ""} sur {items.length}
          </p>
        </div>
        {completed.length > 0 && (
          <span className="text-xs text-emerald-600 font-medium">
            {completed.length} traité{completed.length !== 1 ? "s" : ""} ✓
          </span>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all"
            style={{ width: `${(completed.length / items.length) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {pending.map((item) => {
          const style = SEVERITY_STYLES[item.severity];
          return (
            <label
              key={item.key}
              className={`flex items-start gap-3 border-l-4 rounded-r-xl px-4 py-3 cursor-pointer transition-opacity ${style.bar}`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-500 shrink-0"
                checked={false}
                onChange={() => toggle(item.key)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-slate-800">{item.accountName}</span>
                  <span className="text-xs text-slate-400">{item.mrrFormatted}/mo</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${style.badge}`}>
                    {style.label}
                  </span>
                  <span className="text-xs text-slate-500">{item.title}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{item.detail}</p>
                <p className="text-xs text-slate-600 mt-1 font-medium">→ {item.suggestedAction}</p>
              </div>
            </label>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {completed.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer opacity-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-emerald-500 shrink-0"
                checked={true}
                onChange={() => toggle(item.key)}
              />
              <span className="text-xs text-slate-400 line-through">
                {item.accountName} — {item.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
