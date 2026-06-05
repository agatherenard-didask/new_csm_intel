import { Account, PriorityEntry } from "./types";
import { getHealthScore, getChurnRisk, getPriorityScore } from "./scoring";
import { detectAlerts, detectExpansionSignals } from "./alerts";

function deriveSegment(
  healthScore: number,
  churnRisk: number,
  account: Account
): PriorityEntry["segment"] {
  const isOnboarding = ["Kick off", "Onboarding"].includes(account.clientStage);
  if (isOnboarding) return "onboarding";
  if (churnRisk >= 60 || healthScore < 30) return "churn_risk";
  if (healthScore < 55 || account.trend <= -10) return "adoption_issue";
  const expansions = detectExpansionSignals(account);
  if (expansions.length > 0) return "expansion";
  return "healthy";
}

function mainReason(entry: Omit<PriorityEntry, "mainReason" | "suggestedAction">): string {
  const a = entry.account;
  const { churnRisk, healthScore } = entry;

  if (churnRisk.total >= 70) return `Risque churn critique (${churnRisk.total}/100) — santé ${healthScore}/100`;
  if (churnRisk.daysToRenewal <= 0) return "Contrat expiré";
  if (churnRisk.daysToRenewal <= 120) return `Renouvellement dans ${churnRisk.daysToRenewal}j, santé ${healthScore}/100`;
  if (a.trend <= -20) return `Chute d'usage de ${Math.abs(a.trend)}% sur 30 jours`;
  if (a.uLog > 30) return `Admin inactif depuis ${a.uLog} jours`;
  if (a.pulse <= 2) return `Pulse CSM faible (${a.pulse}/5)`;
  if (detectExpansionSignals(a).length > 0) return detectExpansionSignals(a)[0];
  return `Santé ${healthScore}/100 — suivi standard`;
}

function suggestedAction(segment: PriorityEntry["segment"], account: Account, churnRisk: number): string {
  switch (segment) {
    case "churn_risk":
      return churnRisk >= 80
        ? "Appel de rétention urgent + escalade direction"
        : "Planifier un business review et un plan de renouvellement";
    case "adoption_issue":
      return "Audit d'adoption + session de formation admin";
    case "expansion":
      return "Proposer une extension de contrat ou upsell";
    case "onboarding":
      return `Avancer l'étape d'onboarding (actuelle : ${account.onboarding.currentStep})`;
    case "healthy":
      return "Maintenir le contact — QBR dans 30 jours";
  }
}

export function buildPriorityQueue(accounts: Account[]): PriorityEntry[] {
  const maxMrr = Math.max(...accounts.map((a) => a.mrr));

  return accounts
    .map((account) => {
      const healthScore = getHealthScore(account);
      const churnRisk = getChurnRisk(account, healthScore);
      const priorityScore = getPriorityScore(
        churnRisk.total,
        healthScore,
        account.trend,
        account.mrr,
        maxMrr
      );
      const alerts = detectAlerts(account);
      const segment = deriveSegment(healthScore, churnRisk.total, account);

      const partial = { account, healthScore, churnRisk, priorityScore, alerts, segment };

      return {
        ...partial,
        mainReason: mainReason(partial),
        suggestedAction: suggestedAction(segment, account, churnRisk.total),
      } satisfies PriorityEntry;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function buildPortfolioStats(entries: PriorityEntry[]) {
  return {
    totalAccounts: entries.length,
    totalARR: entries.reduce((s, e) => s + e.account.mrr * 12, 0),
    healthyCount: entries.filter((e) => e.segment === "healthy").length,
    atRiskCount: entries.filter((e) => e.segment === "churn_risk").length,
    needsAttentionCount: entries.filter(
      (e) => e.segment === "adoption_issue" || e.segment === "onboarding"
    ).length,
    avgHealthScore: Math.round(entries.reduce((s, e) => s + e.healthScore, 0) / entries.length),
  };
}
