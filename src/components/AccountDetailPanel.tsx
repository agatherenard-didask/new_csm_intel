"use client";

import { useState } from "react";
import { PriorityEntry, Alert, Contact } from "@/lib/types";
import {
  getHealthScoreDetails,
  daysToDate,
  getOnboardingProgress,
} from "@/lib/scoring";
import { detectExpansionSignals } from "@/lib/alerts";

interface Props {
  entry: PriorityEntry | null;
  onClose: () => void;
}

type PanelTab = "overview" | "onboarding" | "tickets";

const TIER_STYLES: Record<string, string> = {
  Premium: "bg-violet-100 text-violet-700",
  Standard: "bg-slate-100 text-slate-700",
  Light: "bg-sky-100 text-sky-700",
};

function statusFor(entry: PriorityEntry): { label: string; cls: string; dot: string } {
  const { churnRisk, healthScore, account } = entry;
  if (churnRisk.total >= 70) return { label: "Critique", cls: "bg-red-100 text-red-700", dot: "bg-red-500" };
  if (churnRisk.total >= 40 || healthScore < 55)
    return { label: "Vigilance", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
  if (detectExpansionSignals(account).length > 0)
    return { label: "Expansion", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
  return { label: "Sain", cls: "bg-green-100 text-green-700", dot: "bg-green-500" };
}

function relativeDays(isoDate: string): string {
  const ddmmyyyy = isoDate.split("-").reverse().join("/");
  const d = -daysToDate(ddmmyyyy);
  if (d <= 0) return "aujourd'hui";
  if (d === 1) return "il y a 1j";
  return `il y a ${d}j`;
}

function fmtDate(ddmmyyyy: string): string {
  return ddmmyyyy;
}

const ALERT_BORDER: Record<string, string> = {
  critical: "border-red-400",
  warning: "border-amber-400",
  info: "border-blue-400",
};

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 flex-1 rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const TICKET_STATUS: Record<string, string> = {
  résolu: "bg-green-100 text-green-700",
  "en cours": "bg-amber-100 text-amber-700",
  abandonné: "bg-slate-100 text-slate-600",
};

export default function AccountDetailPanel({ entry, onClose }: Props) {
  const [tab, setTab] = useState<PanelTab>("overview");

  if (!entry) return null;

  const a = entry.account;
  const status = statusFor(entry);
  const details = getHealthScoreDetails(a);
  const nonExpAlerts = entry.alerts.filter((al) => al.category !== "expansion");
  const expansionSignals = detectExpansionSignals(a);
  const finDays = daysToDate(a.end);
  const ob = a.onboarding;
  const progress = getOnboardingProgress(a);
  const survey = a.postTrainingSurvey;

  const panelTabs: { key: PanelTab; label: string }[] = [
    { key: "overview", label: "VUE D'ENSEMBLE" },
    { key: "onboarding", label: "ONBOARDING" },
    { key: "tickets", label: "TICKETS" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative z-10 flex h-full w-full flex-col overflow-y-auto bg-white shadow-2xl md:w-[480px]">
        {/* Header */}
        <div className="border-b border-slate-100 p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_STYLES[a.tier]}`}>
              {a.tier}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <button
              onClick={onClose}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">{a.name}</h2>
          <div className="mt-2 flex gap-4 text-sm text-slate-600">
            <span>📅 Début : {fmtDate(a.start)}</span>
            <span className={finDays <= 120 ? "font-semibold text-red-600" : ""}>
              🏁 Fin : {fmtDate(a.end)}
            </span>
          </div>

          {/* External links */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Liens externes
            </p>
            <div className="flex gap-2">
              <a
                href={a.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-[10px] font-bold text-white">
                  D
                </span>
                App Didask
              </a>
              {a.slackChannelUrl ? (
                <a
                  href={a.slackChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Canal Slack
                </a>
              ) : (
                <span className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-300">
                  Canal Slack
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Panel tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {panelTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-3 py-3 text-xs font-semibold tracking-wide ${
                tab === t.key
                  ? "border-[#f9b494] text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6">
          {tab === "overview" && (
            <OverviewTab entry={entry} nonExpAlerts={nonExpAlerts} expansionSignals={expansionSignals} />
          )}
          {tab === "onboarding" && <OnboardingTab entry={entry} progress={progress} />}
          {tab === "tickets" && <TicketsTab entry={entry} />}
        </div>
      </aside>
    </div>
  );

  function OverviewTab({
    entry,
    nonExpAlerts,
    expansionSignals,
  }: {
    entry: PriorityEntry;
    nonExpAlerts: Alert[];
    expansionSignals: string[];
  }) {
    const a = entry.account;
    const d = details;
    return (
      <div className="space-y-6">
        {/* Team */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Équipe Didask
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-400">CSM</p>
              <p className="font-semibold text-slate-900">{a.csm}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-400">KAM</p>
              <p className="font-semibold text-slate-900">{a.kam}</p>
            </div>
          </div>
        </section>

        {/* Client contacts */}
        {a.contacts.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contacts client
            </p>
            <div className="space-y-2">
              {a.contacts.map((c, i) => (
                <ContactCard key={i} contact={c} />
              ))}
            </div>
          </section>
        )}

        {/* Health decomposition */}
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Décomposition health score
          </p>
          <div className="space-y-4">
            <ScoreRow
              title="Account Pulse"
              sub={`Note : ${a.pulse}/5`}
              value={d.pulsePts}
              max={20}
              barColor="bg-green-500"
            />
            <ScoreRow
              title="Engagement"
              sub={`Moy. connexion : ${Math.round(d.engagementAvg)}j`}
              value={d.engagementPts}
              max={40}
              barColor="bg-green-500"
            />
            <ScoreRow
              title="Relation (tier)"
              sub={`Dernier RDV : ${a.meet}j — seuil : ${d.tierThreshold}j`}
              value={d.relationPts}
              max={30}
              barColor="bg-green-500"
            />
            <ScoreRow
              title="Proactivité"
              sub={`RDV planifié : ${a.next ? "Oui" : "Non"}`}
              value={d.proactivityPts}
              max={10}
              barColor={d.proactivityPts === 0 ? "bg-slate-300" : "bg-green-500"}
              valueRed={d.proactivityPts === 0}
            />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#f9b494] to-[#f7a07e] p-4">
            <span className="font-semibold text-white">Score Total</span>
            <span className="text-4xl font-bold text-white">{d.healthScore}/100</span>
          </div>
        </section>

        {/* Active alerts */}
        {nonExpAlerts.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Alertes actives
            </p>
            <div className="space-y-3">
              {nonExpAlerts.map((al) => (
                <div
                  key={al.id}
                  className={`rounded-r-lg border-l-4 bg-slate-50 p-3 ${ALERT_BORDER[al.severity]}`}
                >
                  <p className="text-sm font-semibold text-slate-900">{al.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{al.detail}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">→ {al.suggestedAction}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Expansion signals */}
        {expansionSignals.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Signaux d&apos;expansion
            </p>
            <div className="space-y-2">
              {expansionSignals.map((s, i) => (
                <p key={i} className="text-sm text-blue-700">
                  ↑ {s}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Touch suggestion */}
        {entry.touchSuggestion === "suggest_high" && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">
            ⬆ Envisager passage en High Touch ?
          </div>
        )}
        {entry.touchSuggestion === "suggest_low" && (
          <div className="rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-700">
            ⬇ Ce compte est stable — envisager retour en Low Touch ?
          </div>
        )}
      </div>
    );
  }

  function ContactCard({ contact }: { contact: Contact }) {
    const isChampion = contact.role === "Champion";
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isChampion ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
          {contact.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">{contact.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isChampion ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
              {contact.role}
            </span>
          </div>
          <div className="mt-0.5 flex gap-3 text-xs text-slate-400">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="hover:text-slate-700 truncate">
                {contact.email}
              </a>
            )}
            {contact.phone && <span>{contact.phone}</span>}
            {!contact.email && !contact.phone && <span>—</span>}
          </div>
        </div>
      </div>
    );
  }

  function ScoreRow({
    title,
    sub,
    value,
    max,
    barColor,
    valueRed,
  }: {
    title: string;
    sub: string;
    value: number;
    max: number;
    barColor: string;
    valueRed?: boolean;
  }) {
    return (
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="text-xs text-slate-400">{sub}</span>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBar value={value} max={max} color={barColor} />
          <span className={`w-12 text-right text-sm font-semibold ${valueRed ? "text-red-600" : "text-slate-700"}`}>
            {value}/{max}
          </span>
        </div>
      </div>
    );
  }

  function MentorSection({ entry }: { entry: PriorityEntry }) {
    const ob = entry.account.onboarding;
    return (
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Mentor
        </p>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700">
            {ob.mentor.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{ob.mentor}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Sentiment {ob.mentorSentiment}/5
              </span>
            </div>
            <blockquote className="mt-1 border-l-2 border-slate-200 pl-3 text-sm italic text-slate-600">
              {ob.mentorNote}
            </blockquote>
          </div>
        </div>
      </section>
    );
  }

  function SurveySection({ entry }: { entry: PriorityEntry }) {
    const s = entry.account.postTrainingSurvey;
    if (!s) return null;
    const rate = Math.round((s.responseCount / s.invitedCount) * 100);
    const dims: { label: string; value: number }[] = [
      { label: "Pédagogie", value: s.dimensions.pedagogie },
      { label: "Mentor", value: s.dimensions.mentor },
      { label: "Plateforme", value: s.dimensions.plateforme },
      { label: "ROI", value: s.dimensions.roi },
    ];
    return (
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Satisfaction post-formation
        </p>
        <div className="mb-4">
          <span className="text-5xl font-bold text-amber-500">{s.averageScore}</span>
          <p className="mt-1 text-sm text-slate-600">
            {s.responseCount}/{s.invitedCount} répondants — {rate}% taux de réponse
          </p>
          <p className="text-xs text-slate-400">Sondage complété le {s.completedAt}</p>
        </div>
        <div className="space-y-3">
          {dims.map((dim) => (
            <div key={dim.label}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm text-slate-700">{dim.label}</span>
                <span className="text-sm font-semibold text-slate-700">{dim.value}</span>
              </div>
              <ScoreBar value={dim.value} max={5} color="bg-amber-400" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-green-600">Verbatim positif</p>
            <blockquote className="border-l-2 border-green-300 pl-3 text-sm italic text-slate-600">
              {s.verbatims.positive}
            </blockquote>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600">Verbatim critique</p>
            <blockquote className="border-l-2 border-red-300 pl-3 text-sm italic text-slate-600">
              {s.verbatims.critical}
            </blockquote>
          </div>
        </div>
      </section>
    );
  }

  function OnboardingTab({ entry, progress }: { entry: PriorityEntry; progress: number }) {
    const ob = entry.account.onboarding;
    const sentimentDot =
      ob.mentorSentiment >= 4 ? "bg-green-500" : ob.mentorSentiment >= 3 ? "bg-amber-500" : "bg-red-500";
    const done = ob.currentStep === "Terminé";
    const durationDays = -daysToDate(ob.startDate.split("-").reverse().join("/"));

    return (
      <div className="space-y-6">
        {done ? (
          <div className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">
            ✓ Onboarding terminé le {ob.plannedEndDate}
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Étape : {ob.currentStep}</span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-400">Parcours</p>
            <p className="font-semibold text-slate-900">{ob.track}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-400">Durée</p>
            <p className="font-semibold text-slate-900">{Math.max(0, durationDays)} jours</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-400">Mentor</p>
            <p className="font-semibold text-slate-900">{ob.mentor}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-400">Sentiment</p>
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <span className={`h-2.5 w-2.5 rounded-full ${sentimentDot}`} />
              {ob.mentorSentiment}/5
            </p>
          </div>
        </div>

        <MentorSection entry={entry} />
        <SurveySection entry={entry} />
      </div>
    );
  }

  function TicketsTab({ entry }: { entry: PriorityEntry }) {
    const a = entry.account;
    return (
      <div className="space-y-6">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Conversations support · depuis le début
          </p>
          {a.supportConversations.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune conversation.</p>
          ) : (
            <div className="space-y-2">
              {a.supportConversations.map((c, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="w-24 shrink-0 text-slate-400">{relativeDays(c.date)}</span>
                  <span className="text-slate-700">{c.topic}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tickets support · 90 derniers jours
          </p>
          {a.supportTickets.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun ticket.</p>
          ) : (
            <div className="space-y-2">
              {a.supportTickets.map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-slate-400">{relativeDays(t.date)}</span>
                  <span className="flex-1 text-slate-700">{t.topic}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TICKET_STATUS[t.status]}`}>
                    {t.status}
                  </span>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }
}
