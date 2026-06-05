export function getScoreDetails(c) {
  const d = {pp:0, ep:0, rp:0, pro:0, avg:0, mx:0, tot:0};
  d.pp  = {5:20, 4:15, 3:10, 2:5, 1:0}[c.pulse] || 10;
  d.avg = (c.uLog + c.lLog) / 2;
  d.ep  = d.avg <= 15 ? 40 : d.avg <= 30 ? 20 : 0;
  d.mx  = c.tier === 'Premium' ? 30 : c.tier === 'Standard' ? 90 : 365;
  d.rp  = c.meet <= d.mx ? 30 : c.meet <= d.mx + 30 ? 15 : 0;
  d.pro = c.next ? 10 : 0;
  d.tot = Math.min(d.pp + d.ep + d.rp + d.pro, 100);
  return d;
}

export const calcScore = c => getScoreDetails(c).tot;

export function getDays(s) {
  if (!s) return 9999;
  const [day, month, year] = s.split('/');
  return Math.round((new Date(+year, +month - 1, +day) - new Date()) / 864e5);
}

/*
 * Score Adoption IA (sur 100)
 * 50 pts — Assistant IA activé
 * 20 pts — usage Assistant : min(1, aiMsg ÷ 10) × 20  (seuil de saturation à 10 msg/u)
 * 30 pts — Coach IA activé
 */
export function calcAIAdoption(c) {
  const aiPts      = c.aiAct    ? 50 : 0;
  const aiUsagePts = c.aiAct    ? Math.round(Math.min(1, c.aiMsg / 10) * 20) : 0;
  const coachPts   = c.coachAct ? 30 : 0;
  return { tot: aiPts + aiUsagePts + coachPts, aiPts, aiUsagePts, coachPts };
}

export function getChurnRisk(c, s) {
  const dy = getDays(c.end);
  const hr = Math.min(Math.round(60 - s * 0.6), 60);
  let tr = 0;
  if (dy <= 0) tr = 40;
  else if (dy < 120) tr = Math.round(40 - dy / 120 * 40);
  return {tot: Math.min(hr + tr, 100), hr, tr, dy};
}
