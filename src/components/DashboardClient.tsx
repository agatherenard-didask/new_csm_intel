"use client";

import { useState, useMemo } from "react";
import { PriorityEntry } from "@/lib/types";
import { buildPortfolioStats, buildCsmCapacities } from "@/lib/priority";
import { detectExpansionSignals } from "@/lib/alerts";
import AccountTable from "./AccountTable";
import AccountDetailPanel from "./AccountDetailPanel";

const CSM_LIST = ["Tous", "Agathe", "Adeline", "Antoine", "Charles"] as const;
type CsmFilter = (typeof CSM_LIST)[number];

type TabKey = "ht" | "lt" | "renewals" | "expansion" | "onboarding";

interface Props {
  allEntries: PriorityEntry[];
  today: string;
}

export default function DashboardClient({ allEntries, today }: Props) {
  const [csmFilter, setCsmFilter] = useState<CsmFilter>("Tous");
  const [tab, setTab] = useState<TabKey>("ht");
  const [selected, setSelected] = useState<PriorityEntry | null>(null);
  const [donePriority, setDonePriority] = useState<Set<string>>(new Set());
  const [doneBatch, setDoneBatch] = useState<Set<string>>(new Set());

  const entries = useMemo(
    () =>
      csmFilter === "Tous"
        ? allEntries
        : allEntries.filter((e) => e.account.csm === csmFilter),
    [allEntries, csmFilter]
  );

  const stats = useMemo(() => buildPortfolioStats(entries), [entries]);
  const allCapacities = useMemo(() => buildCsmCapacities(allEntries), [allEntries]);

  // Tab-filtered entries
  const htEntries = entries.filter((e) => e.account.touchModel === "high");
  const ltEntries = entries.filter((e) => e.account.touchModel === "low");
  const renewalEntries = entries.filter(
    (e) => e.churnRisk.daysToRenewal > 0 && e.churnRisk.daysToRenewal <= 120
  );
  const expansionEntries = entries.filter((e) =>
    e.alerts.some((a) => a.category === "expansion")
  );
  const onboardingEntries = entries.filter((e) =>
    ["Kick off", "Onboarding"].includes(e.account.clientStage)
  );

  // KPIs
  const churnAlertCount = entries.filter((e) => e.churnRisk.total >= 60).length;
  const renewalCount = renewalEntries.length;

  // Top-5 priority strip
  const top5 = [...entries].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);

  // Batch block (LT entries with non-expansion alerts, sorted by severity)
  const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const batchItems = ltEntries
    .map((e) => {
      const nonExp = e.alerts.filter((a) => a.category !== "expansion");
      if (nonExp.length === 0) return null;
      const top = [...nonExp].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      )[0];
      return { entry: e, alert: top };
    })
    .filter(Boolean) as { entry: PriorityEntry; alert: (typeof ltEntries)[0]["alerts"][0] }[];

  const batchPending = batchItems.filter((i) => !doneBatch.has(i.entry.account.id));

  // Capacity for selected CSM (or all)
  const capacities =
    csmFilter === "Tous"
      ? allCapacities
      : allCapacities.filter((c) => c.csm === csmFilter);

  const tabs: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: "ht", label: "High Touch", count: htEntries.length, color: "text-amber-600" },
    { key: "lt", label: "Low Touch · Bloc du jour", count: batchPending.length, color: "text-slate-600" },
    { key: "renewals", label: "Renouvellements", count: renewalCount, color: "text-orange-500" },
    { key: "expansion", label: "Expansion", count: expansionEntries.length, color: "text-blue-500" },
    { key: "onboarding", label: "Onboarding", count: onboardingEntries.length, color: "text-violet-500" },
  ];

  const SEVERITY_BADGE: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  const SEVERITY_LABEL: Record<string, string> = {
    critical: "Critique",
    warning: "Attention",
    info: "Info",
  };

  return (
    <>
      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-sm font-bold text-white">
              D
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-700">
              Customer Intelligence
            </span>
          </div>

          {/* CSM filter */}
          <div className="flex items-center gap-1.5">
            {CSM_LIST.map((csm) => (
              <button
                key={csm}
                onClick={() => setCsmFilter(csm)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  csmFilter === csm
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
                }`}
              >
                {csm}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Alertes Churn
              </div>
              <div className="text-2xl font-bold text-red-500">{churnAlertCount}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Renouvellements &lt;120j
              </div>
              <div className="text-2xl font-bold text-orange-500">{renewalCount}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Health Score Moyen
              </div>
              <div className="text-2xl font-bold text-slate-700">
                {stats.avgHealthScore}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Dernière mise à jour : {today}
              </div>
            </div>
          </div>
        </div>

        {/* Capacity bars (only when a specific CSM is selected) */}
        {csmFilter !== "Tous" && capacities.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-2">
            {capacities.map((cap) => (
              <div key={cap.csm} className="flex items-center gap-6 text-xs">
                <span className="font-semibold text-slate-700">{cap.csm}</span>
                <div className="flex items-center gap-2">
                  <span className={cap.htCount > cap.htMax ? "font-bold text-red-600" : "text-amber-700"}>
                    High Touch {cap.htCount}/{cap.htMax}
                  </span>
                  <div className="h-1.5 w-24 rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full ${cap.htCount > cap.htMax ? "bg-red-400" : "bg-amber-400"}`}
                      style={{ width: `${Math.min((cap.htCount / cap.htMax) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cap.ltCount > cap.ltMax ? "font-bold text-red-600" : "text-slate-500"}>
                    Low Touch {cap.ltCount}/{cap.ltMax}
                  </span>
                  <div className="h-1.5 w-24 rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full ${cap.ltCount > cap.ltMax ? "bg-red-400" : "bg-slate-400"}`}
                      style={{ width: `${Math.min((cap.ltCount / cap.ltMax) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-screen-2xl px-6 py-6 space-y-6">
        {/* ── PRIORITY STRIP ──────────────────────────────────────── */}
        {top5.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Tes priorités du jour
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {top5.map((entry) => {
                const isDone = donePriority.has(entry.account.id);
                return (
                  <div
                    key={entry.account.id}
                    className={`flex min-w-[240px] flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm transition-opacity ${
                      isDone ? "opacity-40" : "border-slate-100"
                    }`}
                  >
                    <div>
                      <p className={`font-semibold text-slate-900 ${isDone ? "line-through" : ""}`}>
                        {entry.account.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 leading-snug line-clamp-2">
                        {entry.mainReason}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setSelected(entry)}
                        className="flex-1 rounded-lg bg-[#f9b494] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#f7a07e]"
                      >
                        Détails →
                      </button>
                      <button
                        onClick={() =>
                          setDonePriority((prev) => {
                            const next = new Set(prev);
                            next.has(entry.account.id)
                              ? next.delete(entry.account.id)
                              : next.add(entry.account.id);
                            return next;
                          })
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors ${
                          isDone
                            ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                            : "border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-500"
                        }`}
                        title={isDone ? "Marquer non fait" : "Marquer fait"}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── TAB BAR ─────────────────────────────────────────────── */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-0 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "border-[#f9b494] text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      tab === t.key ? `${t.color} bg-slate-100` : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── TAB CONTENT ─────────────────────────────────────────── */}

        {/* HIGH TOUCH */}
        {tab === "ht" && (
          <div className="space-y-4">
            {/* suggest_low banner */}
            {htEntries.some((e) => e.touchSuggestion === "suggest_low") && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                ⬇{" "}
                <strong>
                  {htEntries.filter((e) => e.touchSuggestion === "suggest_low").length} compte(s) HT stable(s)
                </strong>{" "}
                — envisager un retour en Low Touch pour libérer de la capacité.
              </div>
            )}
            <AccountTable entries={htEntries} onSelect={setSelected} />
          </div>
        )}

        {/* LOW TOUCH + BATCH BLOCK */}
        {tab === "lt" && (
          <div className="space-y-6">
            {/* Batch block */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Mon bloc du jour
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Signaux Low Touch à traiter en batch ·{" "}
                    {batchPending.length} restant{batchPending.length !== 1 ? "s" : ""} sur{" "}
                    {batchItems.length}
                  </p>
                </div>
                {batchItems.length > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">
                    {batchItems.length - batchPending.length} traité{batchItems.length - batchPending.length !== 1 ? "s" : ""} ✓
                  </span>
                )}
              </div>

              {batchItems.length > 0 && (
                <div className="mb-3 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${((batchItems.length - batchPending.length) / batchItems.length) * 100}%`,
                    }}
                  />
                </div>
              )}

              {batchItems.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Aucun signal Low Touch à traiter aujourd&apos;hui. ✓
                </div>
              ) : (
                <div className="space-y-2">
                  {batchItems.map(({ entry, alert }) => {
                    const done = doneBatch.has(entry.account.id);
                    return (
                      <label
                        key={entry.account.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition-opacity ${
                          done ? "opacity-40" : "border-slate-100 shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() =>
                            setDoneBatch((prev) => {
                              const next = new Set(prev);
                              next.has(entry.account.id)
                                ? next.delete(entry.account.id)
                                : next.add(entry.account.id);
                              return next;
                            })
                          }
                          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-semibold text-sm text-slate-900 ${done ? "line-through" : ""}`}>
                              {entry.account.name}
                            </span>
                            <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[alert.severity]}`}>
                              {SEVERITY_LABEL[alert.severity]}
                            </span>
                            <span className="text-xs text-slate-500">{alert.title}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400 truncate">{alert.detail}</p>
                          <p className="mt-1 text-xs font-medium text-slate-600">→ {entry.suggestedAction}</p>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); setSelected(entry); }}
                          className="shrink-0 rounded-lg bg-[#f9b494] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#f7a07e]"
                        >
                          Détails →
                        </button>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* suggest_high banner */}
            {ltEntries.some((e) => e.touchSuggestion === "suggest_high") && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                ⬆{" "}
                <strong>
                  {ltEntries.filter((e) => e.touchSuggestion === "suggest_high").length} compte(s) LT
                </strong>{" "}
                accumule(nt) plusieurs alertes — envisager un passage en High Touch.
              </div>
            )}

            {/* Full LT table */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                Tous les comptes Low Touch
              </h3>
              <AccountTable entries={ltEntries} onSelect={setSelected} />
            </div>
          </div>
        )}

        {/* RENOUVELLEMENTS */}
        {tab === "renewals" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Comptes dont le contrat arrive à échéance dans les 120 prochains jours, triés par urgence.
            </p>
            <AccountTable
              entries={[...renewalEntries].sort(
                (a, b) => a.churnRisk.daysToRenewal - b.churnRisk.daysToRenewal
              )}
              onSelect={setSelected}
            />
          </div>
        )}

        {/* EXPANSION */}
        {tab === "expansion" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Comptes avec des signaux d&apos;expansion détectés (dépassement de licences, croissance d&apos;usage, crédits IA).
            </p>
            <AccountTable
              entries={[...expansionEntries].sort((a, b) => b.account.mrr - a.account.mrr)}
              onSelect={setSelected}
            />
          </div>
        )}

        {/* ONBOARDING */}
        {tab === "onboarding" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Comptes en phase Kick off ou Onboarding.
            </p>
            <AccountTable entries={onboardingEntries} onSelect={setSelected} />
          </div>
        )}
      </main>

      {/* ── DETAIL PANEL ────────────────────────────────────────── */}
      {selected && (
        <AccountDetailPanel entry={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
