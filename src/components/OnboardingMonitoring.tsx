"use client";

import { PriorityEntry } from "@/lib/types";
import { getOnboardingProgress, daysToDate } from "@/lib/scoring";

interface Props {
  entries: PriorityEntry[];
}

const MENTORING_STEPS = ["Session 0", "Atelier 1", "Atelier 2", "Atelier 3"];
const FORMATION_STEPS = ["Session 0", "Atelier 1", "Atelier 2", "Atelier 3", "Atelier 4", "Atelier 5"];

function StepBar({ currentStep, track }: { currentStep: string; track: string }) {
  const steps = track === "mentoring" ? MENTORING_STEPS : FORMATION_STEPS;
  const currentIdx = currentStep === "Terminé" ? steps.length : steps.indexOf(currentStep);

  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1 flex-1 min-w-0">
          <div
            className={`h-1.5 rounded-full flex-1 transition-colors ${
              i < currentIdx
                ? "bg-emerald-400"
                : i === currentIdx
                ? "bg-blue-400"
                : "bg-slate-200"
            }`}
          />
          {i === steps.length - 1 && null}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingMonitoring({ entries }: Props) {
  const onboardingEntries = entries.filter((e) =>
    ["Kick off", "Onboarding"].includes(e.account.clientStage)
  );

  if (onboardingEntries.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Suivi onboarding
        </h2>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-500 text-sm">
          Aucun client en onboarding actuellement.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
        Suivi onboarding ({onboardingEntries.length})
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {onboardingEntries.map((entry) => {
          const { account } = entry;
          const ob = account.onboarding;
          const progress = getOnboardingProgress(account);
          const done = ob.currentStep === "Terminé";

          // Convert YYYY-MM-DD to DD/MM/YYYY for daysToDate
          const plannedEndDDMMYYYY = ob.plannedEndDate.split("-").reverse().join("/");
          const daysLeft = daysToDate(plannedEndDDMMYYYY);
          const isLate = daysLeft < 0 && !done;

          return (
            <div
              key={account.id}
              className={`bg-white rounded-2xl border shadow-sm px-5 py-4 ${
                done ? "border-emerald-200" : isLate ? "border-amber-300" : "border-slate-100"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{account.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{ob.track}</p>
                </div>
                {done ? (
                  <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 rounded-full font-medium">
                    Terminé
                  </span>
                ) : isLate ? (
                  <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 ring-1 ring-amber-200 rounded-full font-medium">
                    En retard
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 ring-1 ring-blue-200 rounded-full font-medium">
                    En cours
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{done ? "Complété" : `Étape : ${ob.currentStep}`}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${done ? "bg-emerald-400" : "bg-blue-400"}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {!done && (
                  <StepBar currentStep={ob.currentStep} track={ob.track} />
                )}
              </div>

              {/* Milestones checklist */}
              <div className="space-y-1 text-xs mb-3">
                {[
                  { label: "Kick-off réalisé", done: true },
                  { label: "Admin formé", done: ob.mentorSentiment >= 3 },
                  {
                    label: "Premier contenu créé",
                    done: account.contentCreationCount > 0,
                  },
                  { label: "Apprenants invités", done: account.seatsUsed > 0 },
                  { label: "1ère activité apprenants", done: account.lLog < 60 },
                ].map(({ label, done: itemDone }) => (
                  <div key={label} className="flex items-center gap-2 text-slate-500">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        itemDone ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300"
                      }`}
                    >
                      {itemDone ? "✓" : "·"}
                    </span>
                    <span className={itemDone ? "line-through opacity-50" : ""}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Mentor note */}
              <div className="border-t border-slate-100 pt-2 mt-2">
                <p className="text-xs text-slate-400 mb-0.5">Mentor : {ob.mentor}</p>
                <p className="text-xs text-slate-500 italic leading-snug">&ldquo;{ob.mentorNote}&rdquo;</p>
              </div>

              {/* Days left */}
              {!done && (
                <div className={`text-xs mt-2 font-medium ${isLate ? "text-amber-600" : "text-slate-400"}`}>
                  {isLate
                    ? `Retard de ${Math.abs(daysLeft)} jours`
                    : `Fin planifiée dans ${daysLeft} jours`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
