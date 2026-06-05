import { Account, Alert, AlertSeverity } from "./types";
import { getHealthScore, getChurnRisk, daysToDate } from "./scoring";

let _alertId = 0;
function makeAlert(
  accountId: string,
  category: Alert["category"],
  severity: AlertSeverity,
  title: string,
  detail: string,
  suggestedAction: string
): Alert {
  return { id: `alert-${++_alertId}`, accountId, category, severity, title, detail, suggestedAction };
}

export function detectAlerts(a: Account): Alert[] {
  const alerts: Alert[] = [];
  const healthScore = getHealthScore(a);
  const churnRisk = getChurnRisk(a, healthScore);

  // ── Adoption Risk ──────────────────────────────────────────────
  const avgLog = (a.uLog + a.lLog) / 2;
  if (avgLog > 30) {
    alerts.push(makeAlert(
      a.id, "adoption",
      avgLog > 60 ? "critical" : "warning",
      "Inactivité prolongée",
      `Dernière connexion il y a ${a.uLog}j, dernière activité longue il y a ${a.lLog}j`,
      "Envoyer un email de réengagement, proposer un check-in"
    ));
  }

  if (a.trend <= -20) {
    alerts.push(makeAlert(
      a.id, "adoption", "critical",
      "Chute d'usage critique",
      `Usage en baisse de ${Math.abs(a.trend)}% sur 30 jours`,
      "Appel de rétention urgent — identifier la cause racine"
    ));
  } else if (a.trend <= -10) {
    alerts.push(makeAlert(
      a.id, "adoption", "warning",
      "Baisse d'usage détectée",
      `Usage en baisse de ${Math.abs(a.trend)}% sur 30 jours`,
      "Planifier un point d'usage avec l'admin"
    ));
  }

  if (a.contentCreationCount === 0) {
    alerts.push(makeAlert(
      a.id, "adoption", "warning",
      "Aucune création de contenu",
      "Aucun contenu créé par le client",
      "Former l'admin à la création de contenu ou organiser un atelier"
    ));
  }

  const seatUtilisation = a.seatsUsed / a.seatsContract;
  if (seatUtilisation < 0.5 && a.clientStage === "Running") {
    alerts.push(makeAlert(
      a.id, "adoption", "warning",
      "Sous-utilisation des licences",
      `${a.seatsUsed}/${a.seatsContract} sièges utilisés (${Math.round(seatUtilisation * 100)}%)`,
      "Proposer un plan d'activation des utilisateurs inactifs"
    ));
  }

  // ── Stakeholder Risk ───────────────────────────────────────────
  if (a.pulse <= 2) {
    alerts.push(makeAlert(
      a.id, "stakeholder",
      a.pulse === 1 ? "critical" : "warning",
      `Pulse CSM très bas (${a.pulse}/5)`,
      "La relation client est dégradée selon la dernière évaluation CSM",
      "Escalade manager + plan de remédiation"
    ));
  }

  if (a.nps !== null && a.nps < 30) {
    alerts.push(makeAlert(
      a.id, "stakeholder", "critical",
      `NPS critique (${a.nps})`,
      "Score de satisfaction client en zone détracteurs",
      "Appel de rétention + enquête qualitative"
    ));
  }

  // ── Renewal Risk ───────────────────────────────────────────────
  if (churnRisk.daysToRenewal <= 0) {
    alerts.push(makeAlert(
      a.id, "renewal", "critical",
      "Contrat expiré",
      `Le contrat a expiré il y a ${Math.abs(churnRisk.daysToRenewal)} jours`,
      "Renouvellement urgent — contacter KAM immédiatement"
    ));
  } else if (churnRisk.daysToRenewal <= 30) {
    alerts.push(makeAlert(
      a.id, "renewal", "critical",
      `Renouvellement dans ${churnRisk.daysToRenewal}j`,
      "Le renouvellement est imminent",
      "Lancer le plan de renouvellement avec le KAM"
    ));
  } else if (churnRisk.daysToRenewal <= 120) {
    alerts.push(makeAlert(
      a.id, "renewal", "warning",
      `Renouvellement dans ${churnRisk.daysToRenewal}j`,
      "Préparer la revue de valeur avant le renouvellement",
      "Programmer un business review et identifier des champions"
    ));
  }

  if (churnRisk.total >= 70) {
    alerts.push(makeAlert(
      a.id, "renewal", "critical",
      `Risque churn élevé (${churnRisk.total}/100)`,
      "Combinaison de santé dégradée et d'urgence temporelle",
      "Plan de rétention urgent + escalade direction"
    ));
  }

  // ── Open Support Tickets ───────────────────────────────────────
  const openTickets = a.supportTickets.filter((t) => t.status === "en cours");
  if (openTickets.length >= 3) {
    alerts.push(makeAlert(
      a.id, "stakeholder", "critical",
      `${openTickets.length} tickets ouverts`,
      "Volume élevé de tickets non résolus génère de la friction",
      "Faire le point avec le support — prioriser la résolution"
    ));
  } else if (openTickets.length > 0) {
    alerts.push(makeAlert(
      a.id, "stakeholder", "info",
      `${openTickets.length} ticket(s) en cours`,
      openTickets.map((t) => t.topic).join(", "),
      "Suivre la résolution et informer le client"
    ));
  }

  // ── Expansion Signals ──────────────────────────────────────────
  if (a.seatsUsed > a.seatsContract * 1.05) {
    alerts.push(makeAlert(
      a.id, "expansion", "info",
      "Dépassement de licences",
      `${a.seatsUsed} utilisateurs actifs pour ${a.seatsContract} licences contractuelles`,
      "Proposer une extension de contrat — opportunité d'upsell"
    ));
  }

  if (a.trend >= 15 && a.clientStage === "Running") {
    alerts.push(makeAlert(
      a.id, "expansion", "info",
      `Croissance d'usage (+${a.trend}%)`,
      `Usage en hausse de ${a.trend}% sur 30 jours — signal d'expansion`,
      "Identifier les nouvelles BU ou équipes à embarquer"
    ));
  }

  if (a.creditsUsed > a.creditsContract * 0.9) {
    alerts.push(makeAlert(
      a.id, "expansion", "info",
      "Crédits IA presque épuisés",
      `${a.creditsUsed}/${a.creditsContract} crédits utilisés`,
      "Proposer une recharge de crédits ou pack supérieur"
    ));
  }

  // ── Onboarding ────────────────────────────────────────────────
  if (["Kick off", "Onboarding"].includes(a.clientStage)) {
    const plannedEnd = daysToDate(
      a.onboarding.plannedEndDate.split("-").reverse().join("/")
    );
    if (plannedEnd < 0) {
      alerts.push(makeAlert(
        a.id, "onboarding", "warning",
        "Onboarding en retard",
        `La date de fin planifiée était ${a.onboarding.plannedEndDate}`,
        "Évaluer les blocages et replanifier avec le mentor"
      ));
    } else if (plannedEnd <= 14) {
      alerts.push(makeAlert(
        a.id, "onboarding", "info",
        `Fin d'onboarding dans ${plannedEnd}j`,
        `Étape actuelle : ${a.onboarding.currentStep}`,
        "Préparer le plan de transition vers l'autonomie"
      ));
    }
  }

  return alerts;
}

export function detectExpansionSignals(a: Account): string[] {
  const signals: string[] = [];

  const seatRatio = a.seatsUsed / a.seatsContract;
  if (seatRatio > 1.05) {
    signals.push(`Dépassement de licences : ${a.seatsUsed} utilisateurs pour ${a.seatsContract} contractuels (+${Math.round((seatRatio - 1) * 100)}%)`);
  }

  if (a.trend >= 15) {
    signals.push(`Croissance d'usage de +${a.trend}% sur 30 jours`);
  }

  if (a.creditsUsed > a.creditsContract * 0.9) {
    signals.push(`Consommation crédits IA à ${Math.round((a.creditsUsed / a.creditsContract) * 100)}% — recharge probable`);
  }

  if (a.nps !== null && a.nps >= 70 && a.clientStage === "Running") {
    signals.push(`NPS élevé (${a.nps}) — client ambassadeur potentiel`);
  }

  if (a.aiAct && a.coachAct) {
    signals.push("Usage full IA (Assistant + Coach) — candidat au tier supérieur");
  }

  return signals;
}
