import { Account, PriorityEntry, TouchSuggestion, CsmCapacity } from "./types";
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

function mainReason(entry: Omit<PriorityEntry, "mainReason" | "suggestedAction" | "touchSuggestion">): string {
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
  const ht = account.touchModel === "high";
  switch (segment) {
    case "churn_risk":
      if (churnRisk >= 80) return "Appel de rétention urgent + escalade direction";
      return ht
        ? "Business review + plan de renouvellement à piloter en direct"
        : "Traiter en batch : envoyer template renouvellement + proposer slot";
    case "adoption_issue":
      return ht
        ? "Audit d'adoption + session de formation admin à planifier"
        : "Envoyer ressources d'adoption en batch + proposer slot si pas de réponse";
    case "expansion":
      return ht
        ? "Préparer proposition upsell — appel dédié avec KAM"
        : "Envoyer email signal d'expansion + orienter vers KAM";
    case "onboarding":
      return ht
        ? `Piloter l'étape d'onboarding (actuelle : ${account.onboarding.currentStep}) — contact direct`
        : `Vérifier avancement onboarding (${account.onboarding.currentStep}) en batch`;
    case "healthy":
      return ht
        ? "Maintenir contact proactif — QBR dans 30 jours"
        : "Aucune action requise — surveiller via dashboard";
  }
}

function detectTouchSuggestion(
  account: Account,
  alerts: ReturnType<typeof detectAlerts>
): TouchSuggestion {
  const nonExpAlerts = alerts.filter((a) => a.category !== "expansion");
  const hasCritical = nonExpAlerts.some((a) => a.severity === "critical");

  if (account.touchModel === "low") {
    // Suggest HT when a LT account accumulates multiple pressure signals
    if (hasCritical || nonExpAlerts.length >= 3) return "suggest_high";
  }

  if (account.touchModel === "high") {
    // Suggest LT when a HT account has been stable: no critical alerts + health not declining
    if (!hasCritical) {
      const hist = account.healthScoreHistory;
      if (hist.length >= 8) {
        const recent = hist[hist.length - 1];
        const monthAgo = hist[hist.length - 8];
        if (recent >= monthAgo - 2) return "suggest_low";
      }
    }
  }

  return null;
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
        touchSuggestion: detectTouchSuggestion(account, alerts),
      } satisfies PriorityEntry;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function buildCsmCapacities(entries: PriorityEntry[]): CsmCapacity[] {
  const map = new Map<string, { ht: number; lt: number }>();
  for (const e of entries) {
    const csm = e.account.csm;
    if (!map.has(csm)) map.set(csm, { ht: 0, lt: 0 });
    const c = map.get(csm)!;
    if (e.account.touchModel === "high") c.ht++;
    else c.lt++;
  }
  return Array.from(map.entries()).map(([csm, counts]) => ({
    csm,
    htCount: counts.ht,
    htMax: 15 as const,
    ltCount: counts.lt,
    ltMax: 65 as const,
  }));
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
    highTouchCount: entries.filter((e) => e.account.touchModel === "high").length,
    lowTouchCount: entries.filter((e) => e.account.touchModel === "low").length,
  };
}
