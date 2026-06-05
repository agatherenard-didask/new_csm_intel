import { Account, ScoreDetails, ChurnRiskDetails, AIAdoptionDetails } from "./types";

const TIER_THRESHOLD: Record<string, number> = {
  Premium: 30,
  Standard: 90,
  Light: 365,
};

export function getHealthScoreDetails(a: Account): ScoreDetails {
  const pulsePts = ({ 5: 20, 4: 15, 3: 10, 2: 5, 1: 0 } as Record<number, number>)[a.pulse] ?? 10;

  const engagementAvg = (a.uLog + a.lLog) / 2;
  const engagementPts = engagementAvg <= 15 ? 40 : engagementAvg <= 30 ? 20 : 0;

  const tierThreshold = TIER_THRESHOLD[a.tier] ?? 90;
  const relationPts = a.meet <= tierThreshold ? 30 : a.meet <= tierThreshold + 30 ? 15 : 0;

  const proactivityPts = a.next ? 10 : 0;

  const healthScore = Math.min(pulsePts + engagementPts + relationPts + proactivityPts, 100);

  return { pulsePts, engagementPts, relationPts, proactivityPts, engagementAvg, tierThreshold, healthScore };
}

export function getHealthScore(a: Account): number {
  return getHealthScoreDetails(a).healthScore;
}

/** Days until/since contract end. Negative = already expired. */
export function daysToDate(ddmmyyyy: string): number {
  const [d, m, y] = ddmmyyyy.split("/").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - Date.now()) / 86_400_000);
}

export function getChurnRisk(a: Account, healthScore: number): ChurnRiskDetails {
  const daysToRenewal = daysToDate(a.end);
  const healthRisk = Math.min(Math.round(60 - healthScore * 0.6), 60);

  let timeRisk = 0;
  if (daysToRenewal <= 0) timeRisk = 40;
  else if (daysToRenewal < 120) timeRisk = Math.round(40 - (daysToRenewal / 120) * 40);

  return { total: Math.min(healthRisk + timeRisk, 100), healthRisk, timeRisk, daysToRenewal };
}

export function getAIAdoption(a: Account): AIAdoptionDetails {
  const aiPts = a.aiAct ? 50 : 0;
  const aiUsagePts = a.aiAct ? Math.round(Math.min(1, a.aiMsg / 10) * 20) : 0;
  const coachPts = a.coachAct ? 30 : 0;
  return { total: aiPts + aiUsagePts + coachPts, aiPts, aiUsagePts, coachPts };
}

/**
 * Priority Score (0–100) — answers "who needs attention most today?"
 *
 * Weights intentionally favour churn risk (the most urgent signal) and
 * health degradation, with a smaller weight for ARR (ensures high-value
 * accounts aren't deprioritised when risk is equal).
 *
 *   40% churn risk
 *   30% inverse health score  (poor health → high priority)
 *   20% trend risk            (negative usage trend boosts score)
 *   10% ARR weight            (normalised 0–100 across portfolio)
 */
export function getPriorityScore(
  churnRisk: number,
  healthScore: number,
  trend: number,
  mrr: number,
  maxMrr: number
): number {
  const trendRisk = Math.min(Math.max(-trend, 0), 50) * 2; // 0–100, higher when trend is negative
  const arrWeight = maxMrr > 0 ? (mrr / maxMrr) * 100 : 0;

  const raw =
    churnRisk * 0.4 +
    (100 - healthScore) * 0.3 +
    trendRisk * 0.2 +
    arrWeight * 0.1;

  return Math.min(Math.round(raw), 100);
}

export function getOnboardingProgress(a: Account): number {
  const { track, currentStep } = a.onboarding;
  if (currentStep === "Terminé") return 100;

  const steps: Record<string, string[]> = {
    mentoring: ["Session 0", "Atelier 1", "Atelier 2", "Atelier 3"],
    "formation initiale": ["Session 0", "Atelier 1", "Atelier 2", "Atelier 3", "Atelier 4", "Atelier 5"],
  };
  const seq = steps[track] ?? [];
  const idx = seq.indexOf(currentStep);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / seq.length) * 100);
}
