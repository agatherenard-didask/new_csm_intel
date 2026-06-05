import { DB, csmWorkload } from './data.js';
import { getScoreDetails, calcScore, getDays, getChurnRisk, calcAIAdoption } from './score.js';

let activeTab = 'all', sortCol = 'score', sortAsc = false, supportPeriod = 'all';
let initialRenderDone = false;

/* Écrit l'état courant des filtres dans l'URL sans rechargement */
function syncURL() {
  const params = new URLSearchParams();
  const search = document.getElementById('si').value;
  const csm    = document.getElementById('fi-csm').value;
  const kam    = document.getElementById('fi-kam').value;
  const tier   = document.getElementById('fi-tier').value;
  const health = document.getElementById('fi-health').value;
  const stage  = document.getElementById('fi-stage').value;
  if (search) params.set('search', search);
  if (csm)    params.set('csm', csm);
  if (kam)    params.set('kam', kam);
  if (tier)   params.set('tier', tier);
  if (health) params.set('health', health);
  if (stage)  params.set('stage', stage);
  if (activeTab !== 'all') params.set('tab', activeTab);
  const qs = params.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

/* Lit location.search au chargement et hydrate les filtres + onglet actif */
function loadFromURL() {
  const p = new URLSearchParams(location.search);
  document.getElementById('si').value        = p.get('search') || '';
  document.getElementById('fi-csm').value    = p.get('csm')    || '';
  document.getElementById('fi-kam').value    = p.get('kam')    || '';
  document.getElementById('fi-tier').value   = p.get('tier')   || '';
  document.getElementById('fi-health').value = p.get('health') || '';
  document.getElementById('fi-stage').value  = p.get('stage')  || '';
  activeTab = p.get('tab') || 'all';
  ['all', 'churn', 'renew', 'exp', 'ai', 'reporting'].forEach(x =>
    document.getElementById('tab-' + x).classList.toggle('on', x === activeTab)
  );
}

/* Remet tous les filtres à zéro et nettoie l'URL + identité */
function resetFilters() {
  document.getElementById('si').value        = '';
  document.getElementById('fi-csm').value    = '';
  document.getElementById('fi-kam').value    = '';
  document.getElementById('fi-tier').value   = '';
  document.getElementById('fi-health').value = '';
  document.getElementById('fi-stage').value  = '';
  localStorage.removeItem('currentUser');
  document.getElementById('user-select').value = '';
  document.getElementById('admin-btn').style.display = 'none';
  activeTab = 'all';
  ['all', 'churn', 'renew', 'exp', 'ai', 'reporting'].forEach(x =>
    document.getElementById('tab-' + x).classList.toggle('on', x === 'all')
  );
  history.replaceState(null, '', location.pathname);
  drawTable();
  renderPriorities();
}

/* Sélection "Je suis…" : stocke l'identité et applique le filtre CSM */
function applyCurrentUser(name) {
  if (name) {
    localStorage.setItem('currentUser', name);
    document.getElementById('admin-btn').style.display = '';
  } else {
    localStorage.removeItem('currentUser');
    document.getElementById('admin-btn').style.display = 'none';
  }
  document.getElementById('fi-csm').value = name;
  drawTable();
  renderPriorities();
}

/* Bouton "Vue globale" : retire le filtre CSM sans effacer l'identité (au prochain reload, la vue personnelle revient) */
function setAdminView() {
  document.getElementById('fi-csm').value = '';
  drawTable();
  renderPriorities();
}

const sc = s => s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)';
const rc = r => r >= 50 ? 'var(--red)' : r >= 30 ? 'var(--amber)' : 'var(--green)';
const lcStage = s => s === 'Kick off' ? 'lc-kickoff' : s === 'Onboarding' ? 'lc-onboarding' : s === 'Conception/diffusion' ? 'lc-conception' : 'lc-running';
const bl = s => s >= 70 ? 'Sain' : s >= 40 ? 'Vigilance' : 'Risque';
const tchip = t => t === 'Premium' ? 'tier-premium' : t === 'Standard' ? 'tier-standard' : 'tier-light';
const pct = (u, c) => Math.min(Math.round(u / c * 100), 150);
const uc = p => p > 100 ? 'var(--green)' : p > 80 ? 'var(--amber)' : 'var(--blue)';
function tr2(v) { return v > 0 ? `<span class="tu">↗ +${v}</span>` : v < 0 ? `<span class="td2">↘ ${v}</span>` : `<span class="teq">→ =</span>`; }
function si2(col) { if (sortCol !== col) return `<span style="color:var(--slate);font-size:10px;margin-left:3px;opacity:.5;">↕</span>`; return sortAsc ? `<span style="color:var(--peach);font-size:10px;margin-left:3px;">↑</span>` : `<span style="color:var(--peach);font-size:10px;margin-left:3px;">↓</span>`; }
function qa(action, name, e) { e.stopPropagation(); alert(`[Demo HubSpot] "${action}" → ${name}`); }
function toggleSort(col) { sortAsc = sortCol === col ? !sortAsc : col === 'name'; sortCol = col; drawTable(); }

function filterSupport(arr, c) {
  if (supportPeriod === 'all') return arr.length;
  const days = supportPeriod === 'meet' ? c.meet : parseInt(supportPeriod);
  const cutoff = Date.now() - days * 86400000;
  return arr.filter(e => new Date(e.date).getTime() >= cutoff).length;
}

function setSupportPeriod(val) {
  supportPeriod = val;
  drawTable();
}

function setTab(t) {
  activeTab = t;
  ['all', 'churn', 'renew', 'exp', 'ai', 'reporting'].forEach(x => document.getElementById('tab-' + x).classList.toggle('on', x === t));
  drawTable();
}

function drillDown(type, value) {
  document.getElementById('fi-health').value = '';
  document.getElementById('fi-csm').value    = '';
  if (type === 'g' || type === 'a' || type === 'r') {
    document.getElementById('fi-health').value = type;
    setTab('all');
  } else if (type === 'csm') {
    document.getElementById('fi-csm').value = value || '';
    setTab('all');
  } else if (type === 'churn') {
    setTab('churn');
  } else if (type === 'exp') {
    setTab('exp');
  } else {
    setTab('all');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const PERIOD_OPTS = [
  ['all','Depuis le début'],['30','30 derniers jours'],['90','90 derniers jours'],
  ['180','6 derniers mois'],['meet','Depuis le dernier RDV'],
];
function periodTh(lbl) {
  const dot = supportPeriod !== 'all' ? '<span class="period-dot"></span>' : '';
  const opts = PERIOD_OPTS.map(([v,l]) => `<option value="${v}"${v===supportPeriod?' selected':''}>${l}</option>`).join('');
  return `<th><div class="th-period-wrap"><span>${lbl}${dot}</span><select class="th-period" onchange="setSupportPeriod(this.value)">${opts}</select></div></th>`;
}

function drawTable() {
  const isPortfolio = activeTab === 'all';
  const isReporting = activeTab === 'reporting';
  document.getElementById('kstrip').style.display   = (isPortfolio || isReporting) ? '' : 'none';
  document.getElementById('overview').style.display = isReporting ? '' : 'none';
  const twrap = document.getElementById('twrap');
  if (twrap) twrap.style.display = isReporting ? 'none' : '';

  const search = document.getElementById('si').value.toLowerCase();
  const csmF   = document.getElementById('fi-csm').value;
  const kamF   = document.getElementById('fi-kam').value;
  const tierF  = document.getElementById('fi-tier').value;
  const hlF    = document.getElementById('fi-health').value;
  const stageF = document.getElementById('fi-stage').value;
  syncURL();
  updateFilterBar();

  if (!initialRenderDone) {
    document.querySelectorAll('.kcrd').forEach((el, i) => {
      el.classList.add('fade-in');
      el.style.animationDelay = (100 + i * 50) + 'ms';
    });
    ['chart-health', 'chart-churn', 'chart-csm', 'chart-workload'].forEach((id, i) => {
      const el = document.getElementById(id).parentElement;
      el.classList.add('fade-in');
      el.style.animationDelay = (200 + i * 50) + 'ms';
    });
  }

  let data = DB.filter(c => c.name.toLowerCase().includes(search) && (!csmF || c.csm === csmF) && (!kamF || c.kam === kamF) && (!tierF || c.tier === tierF));
  if (hlF)    data = data.filter(c => { const s = calcScore(c); return hlF === 'g' ? s >= 70 : hlF === 'a' ? s >= 40 && s < 70 : s < 40; });
  if (stageF) data = data.filter(c => c.clientStage === stageF);
  if (activeTab === 'churn') data = data.filter(c => getChurnRisk(c, calcScore(c)).tot >= 50);
  if (activeTab === 'renew') data = data.filter(c => getDays(c.end) <= 120);
  if (activeTab === 'exp')   data = data.filter(c => calcScore(c) >= 70 || c.seatsUsed > c.seatsContract || c.creditsUsed > c.creditsContract);
  data.sort((a, b) => {
    if (sortCol === 'name')  return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sortCol === 'score') return sortAsc ? calcScore(a) - calcScore(b) : calcScore(b) - calcScore(a);
    if (sortCol === 'risk')  return sortAsc ? getChurnRisk(a, calcScore(a)).tot - getChurnRisk(b, calcScore(b)).tot : getChurnRisk(b, calcScore(b)).tot - getChurnRisk(a, calcScore(a)).tot;
    if (sortCol === 'mrr')   return sortAsc ? a.mrr - b.mrr : b.mrr - a.mrr;
    if (sortCol === 'ai')    return sortAsc ? calcAIAdoption(a).tot - calcAIAdoption(b).tot : calcAIAdoption(b).tot - calcAIAdoption(a).tot;
    if (sortCol === 'meet')  return sortAsc ? a.meet - b.meet : b.meet - a.meet;
    if (sortCol === 'cc')    return sortAsc ? (a.contentCreationCount ?? 0) - (b.contentCreationCount ?? 0) : (b.contentCreationCount ?? 0) - (a.contentCreationCount ?? 0);
    if (sortCol === 'end') {
      const p = s => { const [d,m,y] = s.split('/'); return new Date(y,m-1,d); };
      return sortAsc ? p(a.end) - p(b.end) : p(b.end) - p(a.end);
    }
    return 0;
  });
  updateCharts(data, csmF);

  const allC = DB.filter(c => getChurnRisk(c, calcScore(c)).tot >= 50).length;
  const allR = DB.filter(c => getDays(c.end) <= 120).length;
  const avg = data.length ? Math.round(data.reduce((a, c) => a + calcScore(c), 0) / data.length) : 0;
  const greens = DB.filter(c => calcScore(c) >= 70).length;
  const ambers = DB.filter(c => { const s = calcScore(c); return s >= 40 && s < 70; }).length;
  const reds   = DB.filter(c => calcScore(c) < 40).length;
  const ups    = DB.filter(c => c.seatsUsed > c.seatsContract || c.creditsUsed > c.creditsContract).length;

  document.getElementById('hk-churn').textContent = allC;
  document.getElementById('hk-renew').textContent = allR;
  document.getElementById('hk-score').innerHTML = `${avg}<sup>/100</sup>`;
  document.getElementById('pill-churn').textContent = allC;
  document.getElementById('pill-renew').textContent = allR;
  document.getElementById('kp-tot').textContent = DB.length;
  document.getElementById('kp-g').textContent = greens;
  document.getElementById('kp-gp').textContent = `${Math.round(greens / DB.length * 100)}% du portefeuille`;
  document.getElementById('kp-a').textContent = ambers;
  document.getElementById('kp-ap').textContent = `${Math.round(ambers / DB.length * 100)}% du portefeuille`;
  document.getElementById('kp-r').textContent = reds;
  document.getElementById('kp-rp').textContent = `${Math.round(reds / DB.length * 100)}% du portefeuille`;
  document.getElementById('kp-up').textContent = ups;

  if (isReporting) return;

  const thead = document.getElementById('thead');
  if (activeTab === 'ai') {
    thead.innerHTML = `<tr><th class="s" onclick="toggleSort('name')">Client ${si2('name')}</th><th>Tier / Équipe</th><th class="tc">🤖 Assistant IA</th><th class="tc">🎽 Coach IA</th><th class="s tc" onclick="toggleSort('ai')">Score Adoption IA ${si2('ai')}</th><th class="td-action"></th></tr>`;
  } else if (activeTab === 'exp') {
    thead.innerHTML = `<tr><th class="s" onclick="toggleSort('name')">Client ${si2('name')}</th><th>Tier / Équipe</th><th class="s" onclick="toggleSort('score')">Health Score ${si2('score')}</th><th class="s" onclick="toggleSort('mrr')">MRR ${si2('mrr')}</th><th>Sièges</th><th>Crédits</th><th class="td-action"></th></tr>`;
  } else {
    thead.innerHTML = `<tr><th class="s" onclick="toggleSort('name')">Client ${si2('name')}</th><th>Tier / Équipe</th><th class="s" onclick="toggleSort('score')">Health Score ${si2('score')}</th><th class="s" onclick="toggleSort('risk')">Risque Churn ${si2('risk')}</th><th class="s" onclick="toggleSort('end')">Fin de contrat ${si2('end')}</th><th class="s" onclick="toggleSort('meet')">Dernier RDV ${si2('meet')}</th><th class="s" onclick="toggleSort('cc')">Activité création ${si2('cc')}</th><th>Statut</th>${periodTh('Conversations')}${periodTh('Tickets')}<th class="td-action"></th></tr>`;
  }

  const tbody = document.getElementById('tbody');
  const em = document.getElementById('empty');
  const tcard = document.getElementById('tcard');
  tbody.innerHTML = '';
  if (!data.length) {
    const hasFilters = !!(search || csmF || kamF || tierF || hlF || stageF);
    const { icon, title, sub, showReset } = getEmptyState(hasFilters);
    em.innerHTML = `<div class="empty-state">${icon}<p class="empty-title">${title}</p>${sub ? `<p class="empty-sub">${sub}</p>` : ''}${showReset ? '<button class="ctab" onclick="resetFilters()" style="margin-top:4px;">Réinitialiser les filtres</button>' : ''}</div>`;
    tcard.style.display = 'none';
    em.style.display = 'block';
    return;
  }
  tcard.style.display = '';
  em.style.display = 'none';

  data.forEach((c, rowIdx) => {
    const d = getScoreDetails(c), s = d.tot, ro = getChurnRisk(c, s), r = ro.tot, dl = getDays(c.end);
    const scolor = sc(s), rcolor = rc(r);
    const namecell = `<td><div class="cell-name">${c.name}</div><div class="cell-sub">${c.nps != null ? `NPS · <b style="color:${c.nps >= 60 ? 'var(--green)' : c.nps >= 40 ? 'var(--amber)' : 'var(--red)'};">${c.nps}</b>` : 'NPS · n/a'}</div></td>`;
    const teamcell = `<td><div class="cell-team"><span class="chip ${tchip(c.tier)}">${c.tier}</span><div class="cell-csm"><span class="cell-lbl">CSM :</span> ${c.csm}</div><div class="cell-kam"><span class="cell-lbl">KAM :</span> ${c.kam}</div></div></td>`;
    const stip = `<div class="tb" style="border-left:4px solid ${sc(s)};"><div class="tt">Détail Health Score</div><div class="tr"><span class="tl">Account Pulse</span><span class="tv">${d.pp}/20</span></div><div class="tr"><span class="tl">Engagement</span><span class="tv">${d.ep}/40</span></div><div class="tr"><span class="tl">Relation</span><span class="tv">${d.rp}/30</span></div><div class="tr"><span class="tl">Proactivité</span><span class="tv">${d.pro}/10</span></div><div class="ttot"><span>Total</span><span class="ttot-val" style="color:${sc(s)};">${s}/100</span></div></div>`;
    const scorecell = `<td><div class="tw" style="gap:7px;"><span class="cell-score" style="color:${scolor};">${s}</span><span style="font-size:10px;color:var(--slate);">/100</span>${tr2(c.trend)}<div class="sbar"><div class="sbarf" style="width:${s}%;background:${scolor};"></div></div>${stip}</div></td>`;
    const rtip = `<div class="tb" style="border-left:4px solid ${rc(r)};"><div class="tt">Pondération du risque</div><div class="tr"><span class="tl">Santé dégradée</span><span class="tv">${ro.hr}/60</span></div><div class="tr"><span class="tl">Urgence (${ro.dy}j restants)</span><span class="tv">${ro.tr}/40</span></div><div class="ttot"><span>Risque total</span><span class="ttot-val" style="color:${rc(r)};">${r}/100</span></div></div>`;
    const riskcell = `<td><div class="tw" style="gap:7px;"><span class="cell-score" style="color:${rcolor};">${r}</span><span style="font-size:10px;color:var(--slate);">/100</span><div class="sbar"><div class="sbarf" style="width:${r}%;background:${rcolor};"></div></div>${rtip}</div></td>`;
    const qa_html = `<td class="td-action"><button class="ctab" onclick="openDetails('${c.id}',event)">Détails →</button></td>`;
    const row = document.createElement('tr');
    row.onclick = () => openDetails(c.id);
    if (activeTab === 'ai') {
      const aic = c.aiAct ? `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span class="badge bg">Activé</span><span style="font-size:12px;font-weight:600;">${c.aiMsg} msg/u</span></div>` : `<span class="badge" style="background:var(--bg);color:var(--slate);">Inactif</span>`;
      const coc = c.coachAct ? `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span class="badge bp">Activé</span><span style="font-size:12px;font-weight:600;">${c.coachMsg} msg/u</span></div>` : `<span class="badge" style="background:var(--bg);color:var(--slate);">Inactif</span>`;
      const ai = calcAIAdoption(c), acolor = sc(ai.tot);
      const aitip = `<div class="tb"><div class="tt">Score Adoption IA</div><div class="tr"><span class="tl">🤖 Assistant activé</span><span class="tv">${ai.aiPts}/50</span></div><div class="tr"><span class="tl">Usage (${c.aiMsg} msg/u)</span><span class="tv">${ai.aiUsagePts}/20</span></div><div class="tr"><span class="tl">🎽 Coach activé</span><span class="tv">${ai.coachPts}/30</span></div><div class="ttot"><span>Total</span><span class="ttot-val" style="color:${sc(ai.tot)};">${ai.tot}/100</span></div></div>`;
      const aiscell = `<td class="tc"><div class="tw"><span class="cell-score" style="color:${acolor};">${ai.tot}</span><span style="font-size:10px;color:var(--slate);">/100</span><div class="sbar"><div class="sbarf" style="width:${ai.tot}%;background:${acolor};"></div></div>${aitip}</div></td>`;
      row.innerHTML = namecell + teamcell + `<td class="tc">${aic}</td><td class="tc">${coc}</td>` + aiscell + qa_html;
    } else if (activeTab === 'exp') {
      const mrrcell = `<td><span class="mono" style="font-size:13px;font-weight:600;">${c.mrr.toLocaleString('fr-FR')} €</span></td>`;
      const sp2 = pct(c.seatsUsed, c.seatsContract), cp2 = pct(c.creditsUsed, c.creditsContract);
      const seatcell = `<td><div style="font-size:12px;margin-bottom:4px;"><b style="color:${uc(sp2)}">${c.seatsUsed.toLocaleString('fr-FR')}</b> / ${c.seatsContract.toLocaleString('fr-FR')}${sp2 > 100 ? '<span class="upsell">Upsell</span>' : ''}</div><div style="display:flex;align-items:center;gap:5px;"><div class="ubar"><div class="ubarf" style="width:${Math.min(sp2, 100)}%;background:${uc(sp2)};"></div></div><span style="font-size:10px;color:var(--slate);">${sp2}%</span></div></td>`;
      const credcell = `<td><div style="font-size:12px;margin-bottom:4px;"><b style="color:${uc(cp2)}">${c.creditsUsed.toLocaleString('fr-FR')}</b> / ${c.creditsContract.toLocaleString('fr-FR')}${cp2 > 100 ? '<span class="upsell">Upsell</span>' : ''}</div><div style="display:flex;align-items:center;gap:5px;"><div class="ubar"><div class="ubarf" style="width:${Math.min(cp2, 100)}%;background:${uc(cp2)};"></div></div><span style="font-size:10px;color:var(--slate);">${cp2}%</span></div></td>`;
      row.innerHTML = namecell + teamcell + scorecell + mrrcell + seatcell + credcell + qa_html;
    } else {
      const endAlert = dl <= 30 ? `<span class="badge br badge-sm">${dl}j !</span>` : dl <= 120 ? `<span class="badge ba badge-sm">${dl}j</span>` : '';
      const endcell = `<td><span class="cell-date" style="color:${dl <= 30 ? 'var(--red)' : dl <= 120 ? 'var(--amber)' : 'var(--slate)'};">${c.end}</span>${endAlert}</td>`;
      const meetcell = `<td><span class="cell-meet" style="color:${c.meet <= d.mx ? 'var(--ink)' : 'var(--red)'};">${c.meet}j</span><span class="cell-meet-sub"> · seuil ${d.mx}j</span></td>`;
      const convCount = filterSupport(c.supportConversations, c);
      const tickCount = filterSupport(c.supportTickets, c);
      const stagecell = `<td><span class="badge ${lcStage(c.clientStage)}">${c.clientStage}</span></td>`;
      const convcell = `<td><span style="font-size:15px;font-weight:700;color:${convCount > 0 ? 'var(--ink)' : 'var(--slate)'};">${convCount}</span></td>`;
      const tickcell = `<td><span style="font-size:15px;font-weight:700;color:${tickCount > 0 ? 'var(--ink)' : 'var(--slate)'};">${tickCount}</span></td>`;
      const ccn = c.contentCreationCount ?? 0;
      const ccColor = ccn >= 10 ? 'var(--green)' : ccn >= 3 ? 'var(--amber)' : 'var(--red)';
      const ccDate = c.lastContentCreatedDate ? (() => { const [y,m,d] = c.lastContentCreatedDate.split('-'); return `${d}/${m}/${y}`; })() : 'Aucun contenu';
      const cctip = `<div class="tb"><div class="tt">Activité création</div><div class="tr"><span class="tl">Dernier contenu créé</span><span class="tv">${ccDate}</span></div></div>`;
      const cccell = `<td><div class="tw">${cctip}<div style="display:flex;flex-direction:column;gap:1px;"><span style="font-size:15px;font-weight:700;color:${ccColor};">${ccn}</span><span style="font-size:10px;color:var(--slate);">/30j</span></div></div></td>`;
      row.innerHTML = namecell + teamcell + scorecell + riskcell + endcell + meetcell + cccell + stagecell + convcell + tickcell + qa_html;
    }
    if (!initialRenderDone && rowIdx < 8) {
      row.classList.add('fade-in');
      row.style.animationDelay = (300 + rowIdx * 50) + 'ms';
    }
    tbody.appendChild(row);
  });
}

function openDetails(id, e) {
  if (e) e.stopPropagation();
  const c = DB.find(x => x.id === id), d = getScoreDetails(c), s = d.tot, ro = getChurnRisk(c, s);
  const sbadge = s >= 70 ? 'bg' : s >= 40 ? 'ba' : 'br';
  document.getElementById('sp-chips').innerHTML = `<span class="chip ${tchip(c.tier)}">${c.tier}</span><span class="badge ${sbadge}">${bl(s)}</span>`;
  document.getElementById('sp-name').textContent = c.name;
  document.getElementById('sp-dates').innerHTML = `<span>📅 Début: <b>${c.start}</b></span><span>🏁 Fin: <b style="color:${getDays(c.end) <= 120 ? 'var(--red)' : 'inherit'}">${c.end}</b></span>`;
  document.getElementById('sp-csm').textContent = c.csm;
  document.getElementById('sp-kam').textContent = c.kam;

  const _appTip = (c.appName && c.appName !== c.name) ? ` title="Ouvre ${c.appName} dans Didask App"` : '';
  const _slackIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="vertical-align:middle;"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A"/><path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0"/><path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312z" fill="#2EB67D"/><path d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" fill="#ECB22E"/></svg>`;
  const _slackBtn = c.slackChannelUrl
    ? `<a class="sp-extlink" href="${c.slackChannelUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;">${_slackIcon} Canal Slack</a>`
    : `<span class="sp-extlink sp-extlink-dis" title="Aucun canal Slack partagé pour ce compte" style="display:inline-flex;align-items:center;gap:8px;">${_slackIcon} Canal Slack</span>`;
  document.getElementById('sp-extlinks').innerHTML =
    `<div class="spst" style="margin-bottom:6px;">🔗 Liens externes</div>` +
    `<div style="display:flex;gap:8px;flex-wrap:wrap;">` +
    `<a class="sp-extlink" href="${c.appUrl || '#'}" target="_blank" rel="noopener noreferrer"${_appTip}><img src="https://cdn.prod.website-files.com/6929772b32c6524a8dc1a668/694e6bbad422d65521dad91a_Vector%20(27).webp" alt="" style="height:16px;width:auto;vertical-align:middle;"> App Didask</a>` +
    `${_slackBtn}</div>`;

  const ptc = pts => pts === 0 ? 'var(--red)' : 'var(--green)';
  const rws = [
    {lbl: 'Account Pulse',        sub: `Note: ${c.pulse}/5`,                              pts: d.pp,  mx: 20},
    {lbl: 'Engagement',           sub: `Moy. connexion: ${d.avg.toFixed(0)}j`,            pts: d.ep,  mx: 40},
    {lbl: `Relation (${c.tier})`, sub: `Dernier RDV: ${c.meet}j — seuil: ${d.mx}j`,      pts: d.rp,  mx: 30},
    {lbl: 'Proactivité',         sub: `RDV planifié: ${c.next ? 'Oui' : 'Non'}`,         pts: d.pro, mx: 10},
  ];
  document.getElementById('sp-breakdown').innerHTML = rws.map(rw => `<div class="spsr"><div><div class="spsl">${rw.lbl}</div><div class="spsb">${rw.sub}</div></div><div class="spbw"><div class="spbt" style="width:80px;"><div class="spbf" style="width:${rw.mx ? rw.pts / rw.mx * 100 : 0}%;background:${ptc(rw.pts)};"></div></div><span style="font-family:'Inter',system-ui,sans-serif;font-variant-numeric:tabular-nums;font-feature-settings:'cv11','ss01';font-size:11px;color:${ptc(rw.pts)};width:38px;text-align:right;">${rw.pts}/${rw.mx}</span></div></div>`).join('');
  document.getElementById('sp-total').textContent = `${s}/100`;

  const srcs = [
    {name: 'HubSpot',    icon: '🟠', status: c.meet < 999 ? `Dernier RDV: ${c.meet}j` : 'Non connecté', ok: c.meet < 90},
    {name: 'Modjo',      icon: '🎧', status: c.pulse > 0 ? `Pulse: ${c.pulse}/5 · Appels trackés` : 'Pas de data', ok: c.pulse >= 3},
    {name: 'Hyperline',  icon: '💜', status: c.mrr ? `MRR: ${c.mrr.toLocaleString('fr-FR')} €` : 'Non connecté', ok: !!c.mrr},
    {name: 'Didask App', icon: '🧭', status: `Engagement: ${d.avg.toFixed(0)}j moy. connexion`, ok: d.avg <= 30},
  ];
  document.getElementById('sp-sources').innerHTML = srcs.map(src => `<div class="sprr" style="background:var(--bg);margin-bottom:6px;"><span style="font-size:11px;font-weight:600;">${src.icon} ${src.name}</span><span style="font-size:10px;font-weight:600;color:${src.ok ? 'var(--green)' : 'var(--amber)'};">${src.status}</span></div>`).join('');

  document.getElementById('sp-ai').innerHTML    = c.aiAct    ? `<span style="color:var(--green);font-weight:700;">${c.aiMsg} msg/user</span>`    : `<span style="color:var(--slate);">Non déployé</span>`;
  document.getElementById('sp-coach').innerHTML = c.coachAct ? `<span style="color:var(--purple);font-weight:700;">${c.coachMsg} msg/user</span>` : `<span style="color:var(--slate);">Non déployé</span>`;

  const ticketCutoff = Date.now() - 90 * 86400000;
  const recentTickets = (c.supportTickets || [])
    .filter(t => new Date(t.date).getTime() >= ticketCutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const shownTickets = recentTickets.slice(0, 5);
  const tStatusCfg = { 'en cours': {bg:'#dbeafe',color:'#3b82f6'}, 'résolu': {bg:'#d1fae5',color:'#059669'}, 'abandonné': {bg:'#f3f4f6',color:'#6b7280'} };
  document.getElementById('sp-tickets').innerHTML = shownTickets.length === 0
    ? `<p style="font-size:12px;color:var(--slate);padding:6px 0 0;">Aucun ticket support sur les 90 derniers jours.</p>`
    : shownTickets.map(t => {
        const days = Math.round((Date.now() - new Date(t.date).getTime()) / 86400000);
        const ago = days === 0 ? "aujourd'hui" : days === 1 ? 'il y a 1 jour' : `il y a ${days} jours`;
        const sc = tStatusCfg[t.status] || tStatusCfg['abandonné'];
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line);">
          <span style="font-size:10px;color:var(--slate);white-space:nowrap;flex-shrink:0;">${ago}</span>
          <span style="font-size:11px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${t.topic}">${t.topic}</span>
          <span style="background:${sc.bg};color:${sc.color};font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap;flex-shrink:0;">${t.status}</span>
          <a href="${t.url}" target="_blank" rel="noopener noreferrer" style="font-size:14px;color:var(--slate);text-decoration:none;flex-shrink:0;line-height:1;" title="Ouvrir dans Intercom">↗</a>
        </div>`;
      }).join('') + (recentTickets.length > 5
        ? `<div style="padding:8px 0 0;"><a href="#" onclick="return false;" style="font-size:11px;color:var(--blue);font-weight:600;text-decoration:none;">Voir tous (${recentTickets.length})</a></div>`
        : '');

  document.getElementById('sp-usage').innerHTML = [{lbl:'Sièges',u:c.seatsUsed,ct:c.seatsContract},{lbl:'Crédits',u:c.creditsUsed,ct:c.creditsContract}].map(u => {
    const p = pct(u.u, u.ct), col = uc(p);
    return `<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="font-weight:600;">${u.lbl}</span><span><b style="color:${col};">${u.u.toLocaleString('fr-FR')}</b> / ${u.ct.toLocaleString('fr-FR')} — <span style="color:${col};font-weight:700;">${p}%</span>${p > 100 ? '<span class="upsell">Upsell</span>' : ''}</span></div><div class="ubar" style="height:6px;width:100%;"><div class="ubarf" style="width:${Math.min(p,100)}%;background:${col};"></div></div></div>`;
  }).join('');

  const _dAgo  = iso => iso ? Math.round((Date.now() - new Date(iso).getTime()) / 86400000) : null;
  const _rAgo  = n => n === null ? null : n === 0 ? "aujourd'hui" : n === 1 ? 'il y a 1 jour' : `il y a ${n} jours`;
  const _abs   = iso => { if (!iso) return ''; const [y,m,dd] = iso.split('-'); return `${dd}/${m}/${y}`; };
  const _silC  = n => n === null ? 'var(--slate)' : n > 60 ? 'var(--red)' : n > 30 ? 'var(--amber)' : 'var(--ink)';
  const _iType = () => {
    const dt = c.lastInteractionDate;
    if (!dt) return 'via interaction';
    if (dt === c.lastEmailDate) return 'via email';
    const ltk = (c.supportTickets || []).reduce((mx, t) => t.date > mx ? t.date : mx, '');
    if (dt === ltk) return 'via ticket Intercom';
    const lcv = (c.supportConversations || []).reduce((mx, t) => t.date > mx ? t.date : mx, '');
    if (dt === lcv) return 'via conversation';
    return 'via meeting';
  };
  const emailDays = _dAgo(c.lastEmailDate);
  const intDays   = _dAgo(c.lastInteractionDate);
  const emailVal  = c.lastEmailDate
    ? `<span style="color:${_silC(emailDays)};font-weight:600;">${_rAgo(emailDays)}</span> <span style="color:var(--slate);font-size:11px;">${_abs(c.lastEmailDate)}</span>`
    : `<span style="color:var(--slate);">Non disponible</span>`;
  const intVal    = c.lastInteractionDate
    ? `<span style="color:${_silC(intDays)};font-weight:600;">${_rAgo(intDays)}</span> <span style="color:var(--slate);font-size:11px;">${_abs(c.lastInteractionDate)} · ${_iType()}</span>`
    : `<span style="color:var(--slate);">Non disponible</span>`;
  const relRows = [
    {icon:'📧', lbl:'Dernier email',        val: emailVal,                                                                                                                                                                          bg:'var(--bg)'},
    {icon:'🔔', lbl:'Dernière interaction',  val: intVal,                                                                                                                                                                            bg:'var(--bg)'},
    {icon:'🤝', lbl:'Dernier meeting',       val:`Il y a ${c.meet} jours${c.meet > d.mx ? ' <b style="color:var(--red);">(En retard)</b>' : ''}`,                                                                                   bg:'var(--bg)'},
    {icon:'📅', lbl:'Prochain RDV',          val:c.next || '<b style="color:var(--red);">Non planifié ⚠</b>',                                                                                                                       bg:'#fdf6f3'},
    {icon:'📊', lbl:'NPS',                   val:c.nps != null ? `<b style="color:${c.nps >= 60 ? 'var(--green)' : c.nps >= 40 ? 'var(--amber)' : 'var(--red)'};">${c.nps}</b>` : 'Non disponible',                                bg:'var(--bg)'},
  ];
  if (c.postTrainingSurvey) {
    const pts = c.postTrainingSurvey;
    const sColor = pts.averageScore >= 8 ? 'var(--green)' : pts.averageScore >= 6 ? 'var(--amber)' : 'var(--red)';
    const dc = v => v >= 8 ? 'var(--green-dot)' : v >= 6 ? 'var(--amber-dot)' : 'var(--red-dot)';
    const tipRows = [['Pédagogie', pts.dimensions.pedagogie],['Mentor', pts.dimensions.mentor],['Plateforme', pts.dimensions.plateforme],['ROI', pts.dimensions.roi]]
      .map(([l, v]) => `<div class="tr"><span class="tl">${l}</span><span class="tv" style="color:${dc(v)};">${v}/10</span></div>`).join('');
    relRows.push({
      icon:'📊', lbl:'Satisfaction formation', bg:'var(--bg)',
      val:`<span class="sp-tip-trigger" onmouseenter="showSpTip(this)" onmouseleave="hideSpTip(this)"><b style="color:${sColor};">${pts.averageScore}/10</b><div class="tb" style="border-left:4px solid ${sColor};"><div class="tt">Satisfaction post-formation</div>${tipRows}</div></span>`,
    });
  }
  document.getElementById('sp-relation').innerHTML = relRows.map(rel => `<div class="sprr" style="background:${rel.bg};"><span style="font-size:12px;font-weight:600;">${rel.icon} ${rel.lbl}</span><span style="font-size:12px;">${rel.val}</span></div>`).join('');

  document.getElementById('sp-actions').innerHTML = ['✉️ Email','📞 Appel','📝 Note HubSpot','📋 Créer tâche','🔗 Ouvrir deal'].map(a => `<button onclick="qa('${a}','${c.name.replace(/'/g,"\\'")}',event)" style="padding:7px 12px;border-radius:8px;border:1px solid var(--line);background:var(--bg);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .12s;" onmouseover="this.style.cssText=this.style.cssText+'background:var(--peach);color:white;border-color:var(--peach);'" onmouseout="this.style.background='var(--bg)';this.style.color='var(--ink)';this.style.borderColor='var(--line)'">${a}</button>`).join('');

  document.querySelector('[data-panel="onboarding"]').innerHTML = buildOnboardingPanel(c);
  setSPTab('overview');
  document.getElementById('sp').classList.add('open');
  document.getElementById('overlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function buildSurveySection(pts) {
  if (!pts) {
    return `<div class="ob-survey-placeholder">📮 Sondage post-formation à envoyer — réponses non encore disponibles.</div>`;
  }
  const scoreColor = pts.averageScore >= 8 ? 'var(--green)' : pts.averageScore >= 6 ? 'var(--amber)' : 'var(--red)';
  const dimColor   = v => v >= 8 ? 'var(--green-dot)' : v >= 6 ? 'var(--amber-dot)' : 'var(--red-dot)';
  const rate       = Math.round(pts.responseCount / pts.invitedCount * 100);
  const [cy, cm, cd] = pts.completedAt.split('-');
  const dimBar = (lbl, val) =>
    `<div class="ob-survey-dim"><span class="ob-survey-dlbl">${lbl}</span><div class="ob-survey-dtrack"><div class="ob-survey-dfill" style="width:${val * 10}%;background:${dimColor(val)};"></div></div><span class="ob-survey-dval" style="color:${dimColor(val)};">${val}</span></div>`;
  const verbatims = [
    pts.verbatims?.positive ? `<div class="ob-verbatim ob-verbatim-pos">💚 <em>${pts.verbatims.positive}</em></div>` : '',
    pts.verbatims?.critical ? `<div class="ob-verbatim ob-verbatim-crit">⚠️ <em>${pts.verbatims.critical}</em></div>` : '',
  ].filter(Boolean).join('');
  return `<div class="ob-survey-card">
    <div class="spst">Satisfaction post-formation</div>
    <div class="ob-survey-header">
      <div><span class="ob-survey-score" style="color:${scoreColor};">${pts.averageScore}</span><span class="ob-survey-denom">/10</span></div>
      <div class="ob-survey-meta">
        <span class="ob-survey-resp">${pts.responseCount}/${pts.invitedCount} répondants — ${rate}% taux de réponse</span>
        <span class="ob-survey-date">Sondage complété le ${cd}/${cm}/${cy}</span>
      </div>
    </div>
    <div class="ob-survey-dims">${dimBar('Pédagogie', pts.dimensions.pedagogie)}${dimBar('Mentor', pts.dimensions.mentor)}${dimBar('Plateforme', pts.dimensions.plateforme)}${dimBar('ROI', pts.dimensions.roi)}</div>
    ${verbatims ? `<div class="ob-survey-verbatims">${verbatims}</div>` : ''}
    <a class="ob-survey-link" href="${pts.typeformResultsUrl}" target="_blank" rel="noopener">Voir toutes les réponses sur Typeform ↗</a>
  </div>`;
}

function buildOnboardingPanel(c) {
  const ob = c.onboarding;
  if (!ob) return '<p class="sp-placeholder">Pas de données d\'onboarding.</p>';

  const fmt        = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  const trackLabel = ob.track === 'mentoring' ? 'Mentoring' : 'Formation initiale';
  const initials   = ob.mentor.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sentCls    = ob.mentorSentiment <= 2 ? 'br' : ob.mentorSentiment === 3 ? 'ba' : 'bg';
  const mentorCard = `<div class="ob-mentor-card">
    <div class="spst">Mentor</div>
    <div class="ob-mentor-head">
      <div class="ob-mentor-avatar">${initials}</div>
      <div><div class="ob-mentor-name">${ob.mentor}</div><span class="badge ${sentCls}">Sentiment ${ob.mentorSentiment}/5</span></div>
    </div>
    <div class="ob-mentor-note">${ob.mentorNote}</div>
  </div>`;

  if (ob.currentStep === 'Terminé') {
    const duration = Math.round((new Date(ob.plannedEndDate) - new Date(ob.startDate)) / 86400000);
    return `<div class="ob-card">
      <div class="ob-done-banner">✓ Onboarding terminé le ${fmt(ob.plannedEndDate)}</div>
      <div class="ob-done-summary">
        <div class="ob-date-row"><span class="ob-date-lbl">Parcours</span><span class="ob-date-val">${trackLabel}</span></div>
        <div class="ob-date-row"><span class="ob-date-lbl">Durée</span><span class="ob-date-val">${duration} jours</span></div>
        <div class="ob-date-row"><span class="ob-date-lbl">Mentor</span><span class="ob-date-val">${ob.mentor}</span></div>
        <div class="ob-date-row"><span class="ob-date-lbl">Sentiment</span><span class="badge ${sentCls}">Sentiment ${ob.mentorSentiment}/5</span></div>
      </div>
      ${mentorCard}
      ${buildSurveySection(c.postTrainingSurvey)}
    </div>`;
  }

  const steps      = ob.track === 'mentoring'
    ? ['Session 0', 'Atelier 1', 'Atelier 2', 'Atelier 3']
    : ['Session 0', 'Atelier 1', 'Atelier 2', 'Atelier 3', 'Atelier 4', 'Atelier 5'];
  const currentIdx = steps.indexOf(ob.currentStep);

  const parts = [];
  steps.forEach((step, i) => {
    const done    = i < currentIdx;
    const current = i === currentIdx;
    const cls = done ? 'ob-circle-done' : current ? 'ob-circle-current' : 'ob-circle-future';
    parts.push(`<div class="ob-step"><div class="ob-circle ${cls}">${done ? '✓' : ''}</div><div class="ob-step-label">${step}</div></div>`);
    if (i < steps.length - 1)
      parts.push(`<div class="ob-connector${i < currentIdx ? ' ob-line-done' : ''}"></div>`);
  });

  const daysLeft  = Math.round((new Date(ob.plannedEndDate) - new Date()) / 86400000);
  const delayHtml = daysLeft > 0
    ? `<span class="ob-delay-ok">${daysLeft} jours restants</span>`
    : `<span class="ob-delay-late">${Math.abs(daysLeft)} jours de retard</span>`;

  return `<div class="ob-card">
    <span class="ob-track-badge">${trackLabel}</span>
    <div class="ob-stepper">${parts.join('')}</div>
    <div class="ob-dates-card">
      <div class="ob-date-row"><span class="ob-date-lbl">Démarrage</span><span class="ob-date-val">${fmt(ob.startDate)}</span></div>
      <div class="ob-date-row"><span class="ob-date-lbl">Fin prévue</span><span class="ob-date-val">${fmt(ob.plannedEndDate)}</span></div>
      <div class="ob-date-row"><span class="ob-date-lbl">Délai</span>${delayHtml}</div>
    </div>
    ${mentorCard}
  </div>`;
}

function setSPTab(tab) {
  document.querySelectorAll('#spscr [data-panel]').forEach(el => {
    el.style.display = el.dataset.panel === tab ? '' : 'none';
  });
  document.querySelectorAll('.sp-tab').forEach(el => {
    el.classList.toggle('on', el.dataset.tab === tab);
  });
}

function closeDetails() {
  document.getElementById('sp').classList.remove('open');
  document.getElementById('overlay').style.display = 'none';
  document.body.style.overflow = '';
}

/* ─── FILTER BAR STATE ─── */
function updateFilterBar() {
  const search = document.getElementById('si').value;
  const filterIds = ['fi-csm', 'fi-kam', 'fi-tier', 'fi-health', 'fi-stage'];
  let count = search ? 1 : 0;
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    const active = !!el.value;
    if (active) count++;
    el.closest('.fsel-wrap').classList.toggle('active', active);
  });
  document.getElementById('si').classList.toggle('active', !!search);
  const btn = document.getElementById('reset-btn');
  const counter = document.getElementById('filter-count');
  counter.textContent = `(${count} filtre${count > 1 ? 's' : ''} actif${count > 1 ? 's' : ''})`;
  counter.style.display = count > 0 ? '' : 'none';
  btn.style.opacity = count > 0 ? '1' : '0.4';
  btn.style.cursor = count > 0 ? 'pointer' : 'not-allowed';
  btn.style.pointerEvents = count > 0 ? '' : 'none';
}

/* ─── CHARTS ─── */
let chartHealth = null, chartChurn = null, chartCsmStack = null, chartWorkload = null;

function healthOpts(data) {
  const g = data.filter(c => calcScore(c) >= 70).length;
  const a = data.filter(c => { const s = calcScore(c); return s >= 40 && s < 70; }).length;
  const r = data.filter(c => calcScore(c) < 40).length;
  return {
    chart: {
      type: 'donut', height: 200, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (_e, _ctx, cfg) => drillDown(['g','a','r'][cfg.dataPointIndex]) },
    },
    series:      [g, a, r],
    labels:      ['Sain', 'Vigilance', 'Risque'],
    colors:      ['#10b981', '#f59e0b', '#ef4444'],
    plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Total', fontSize: '11px', color: '#8892a4', fontWeight: 600 } } } } },
    dataLabels:  { enabled: false },
    stroke:      { width: 0 },
    states:      { hover: { filter: { type: 'lighten', value: 0.08 } }, active: { filter: { type: 'darken', value: 0.88 } } },
  };
}

function churnOpts(data) {
  const top5 = [...data]
    .sort((a, b) => getChurnRisk(b, calcScore(b)).tot - getChurnRisk(a, calcScore(a)).tot)
    .slice(0, 5);
  return {
    chart: {
      type: 'bar', height: 200, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (_e, _ctx, cfg) => { const acc = top5[cfg.dataPointIndex]; if (acc) openDetails(acc.id); } },
    },
    series:      [{ name: 'Risque churn', data: top5.map(c => getChurnRisk(c, calcScore(c)).tot) }],
    xaxis:       { categories: top5.map(c => c.name) },
    yaxis:       { max: 100 },
    colors:      ['#ef4444'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels:  { enabled: false },
    tooltip:     { y: { formatter: v => v + '/100' } },
    grid:        { borderColor: '#e5e9f0' },
    states:      { hover: { filter: { type: 'darken', value: 0.82 } }, active: { filter: { type: 'darken', value: 0.72 } } },
  };
}

function csmStackOpts(data) {
  const csms = [...new Set(data.map(c => c.csm))].sort();
  return {
    chart: {
      type: 'bar', height: 200, stacked: true, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (_e, _ctx, cfg) => { const csm = csms[cfg.dataPointIndex]; if (csm) drillDown('csm', csm); } },
    },
    series: [
      { name: 'Sain',      data: csms.map(csm => data.filter(c => c.csm === csm && calcScore(c) >= 70).length) },
      { name: 'Vigilance', data: csms.map(csm => data.filter(c => c.csm === csm && calcScore(c) >= 40 && calcScore(c) < 70).length) },
      { name: 'Risque',    data: csms.map(csm => data.filter(c => c.csm === csm && calcScore(c) < 40).length) },
    ],
    xaxis:       { categories: csms },
    colors:      ['#10b981', '#f9b494', '#ef4444'],
    plotOptions: { bar: { borderRadius: 3 } },
    dataLabels:  { enabled: false },
    legend:      { show: false },
    grid:        { borderColor: '#e5e9f0' },
    yaxis:       { tickAmount: 3, labels: { formatter: v => Math.round(v) } },
    states:      { hover: { filter: { type: 'darken', value: 0.82 } }, active: { filter: { type: 'darken', value: 0.72 } } },
  };
}

function workloadOpts(csmF) {
  const entries = Object.entries(csmWorkload)
    .filter(([name]) => !csmF || name.startsWith(csmF))
    .sort((a, b) => b[1] - a[1]);
  const maxVal = entries.length ? Math.max(...entries.map(([, v]) => v)) * 1.25 : 150;
  return {
    chart: {
      type: 'bar', height: 200, fontFamily: "'DM Sans',sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (_e, _ctx, cfg) => { const fn = entries[cfg.dataPointIndex]?.[0].split(' ')[0]; if (fn) drillDown('csm', fn); } },
    },
    series:      [{ name: 'Workload', data: entries.map(([, v]) => v) }],
    xaxis:       { categories: entries.map(([name]) => name.split(' ')[0]), labels: { rotate: -45 } },
    colors:      ['#f9b494'],
    plotOptions: { bar: { borderRadius: 4, dataLabels: { position: 'top' } } },
    dataLabels:  { enabled: true, offsetY: -18, formatter: v => v, style: { fontWeight: '700', colors: ['#1a1a1a'], fontSize: '11px' } },
    legend:      { show: false },
    grid:        { borderColor: '#e5e9f0' },
    yaxis:       { show: false, max: maxVal },
    states:      { hover: { filter: { type: 'darken', value: 0.82 } }, active: { filter: { type: 'darken', value: 0.72 } } },
  };
}

function updateCharts(data, csmF) {
  if (!chartHealth) {
    chartHealth   = new ApexCharts(document.getElementById('chart-health'),   healthOpts(data));
    chartChurn    = new ApexCharts(document.getElementById('chart-churn'),    churnOpts(data));
    chartCsmStack = new ApexCharts(document.getElementById('chart-csm'),      csmStackOpts(data));
    chartWorkload = new ApexCharts(document.getElementById('chart-workload'), workloadOpts(csmF));
    chartHealth.render();
    chartChurn.render();
    chartCsmStack.render();
    chartWorkload.render();
    return;
  }
  chartHealth.updateOptions(healthOpts(data), false, false);
  chartChurn.updateOptions(churnOpts(data), false, false);
  chartCsmStack.updateOptions(csmStackOpts(data), false, false);
  chartWorkload.updateOptions(workloadOpts(csmF), false, false);
}

/* ─── PRIORITIES ─── */
const DISMISS_TTL = 24 * 60 * 60 * 1000;

function isDismissed(id) {
  const ts = localStorage.getItem('p_' + id);
  return ts && (Date.now() - parseInt(ts)) < DISMISS_TTL;
}

function dismissPriority(id) {
  localStorage.setItem('p_' + id, Date.now());
  renderPriorities();
}

function getPriorities() {
  const user = localStorage.getItem('currentUser');
  const pool = user ? DB.filter(c => c.csm === user) : DB;
  const results = [];
  for (const c of pool) {
    if (isDismissed(c.id) || results.length >= 5) continue;
    const s = calcScore(c), ro = getChurnRisk(c, s), dl = getDays(c.end);
    if (ro.tot >= 70 && !c.next)
      results.push({ c, reason: `Risque churn ${ro.tot}/100 et aucun prochain RDV planifié.` });
    else if (dl < 60 && s < 70)
      results.push({ c, reason: `Renouvellement dans ${dl}j avec un health score de ${s}/100.` });
    else if (c.tier === 'Premium' && c.meet > 30)
      results.push({ c, reason: `Compte Premium sans RDV depuis ${c.meet}j (seuil 30j).` });
    else if (c.seatsUsed > c.seatsContract || c.creditsUsed > c.creditsContract) {
      const what = c.seatsUsed > c.seatsContract ? 'sièges' : 'crédits';
      const ratio = what === 'sièges' ? `${c.seatsUsed}/${c.seatsContract}` : `${c.creditsUsed}/${c.creditsContract}`;
      results.push({ c, reason: `Opportunité upsell : ${what} dépassés (${ratio}).` });
    }
  }
  return results;
}

const SVG_MAGNIFIER = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="13" stroke="#cbd5e1" stroke-width="2.5"/><path d="M30 30L41 41" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/><path d="M20 14v7M20 24v1" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/></svg>`;
const SVG_CHECK     = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="18" stroke="#a7f3d0" stroke-width="2.5"/><path d="M15 24l7 7 11-14" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function getEmptyState(hasFilters) {
  if (hasFilters) return {
    icon: SVG_MAGNIFIER,
    title: 'Aucun compte ne correspond à tes filtres',
    sub: 'Essaie d\'élargir tes critères de recherche ou réinitialise les filtres.',
    showReset: true,
  };
  if (activeTab === 'churn') return {
    icon: SVG_CHECK,
    title: 'Aucun compte n\'est actuellement à risque de churn 🎉',
    sub: 'Tous tes comptes sont en bonne santé. Profites-en pour anticiper les prochains renouvellements.',
    showReset: false,
  };
  if (activeTab === 'renew') return {
    icon: SVG_MAGNIFIER,
    title: 'Aucun renouvellement à venir dans les 120 jours',
    sub: 'Aucun contrat n\'arrive à échéance dans les 4 prochains mois.',
    showReset: false,
  };
  if (activeTab === 'exp') return {
    icon: SVG_MAGNIFIER,
    title: 'Aucune opportunité d\'upsell détectée pour l\'instant',
    sub: 'Les comptes actifs sont en dessous de leurs limites contractuelles.',
    showReset: false,
  };
  return {
    icon: SVG_MAGNIFIER,
    title: 'Aucun compte dans cette vue',
    sub: '',
    showReset: false,
  };
}

function renderPriorities() {
  const items = getPriorities();
  const bar = document.getElementById('pbar');
  if (!items.length) { bar.style.display = 'none'; return; }
  bar.style.display = '';
  document.getElementById('plist').innerHTML = items.map(({ c, reason }, i) =>
    `<div class="${!initialRenderDone ? 'fade-in' : ''}" style="${!initialRenderDone ? `animation-delay:${i * 50}ms;` : ''}background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;min-width:200px;flex:1;max-width:380px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
        <div style="font-size:11px;color:var(--slate);margin-top:2px;line-height:1.4;">${reason}</div>
      </div>
      <button class="detb" onclick="openDetails('${c.id}',event)" style="flex-shrink:0;">Détails →</button>
      <button class="qab" onclick="dismissPriority('${c.id}')" title="Marquer comme traité" style="flex-shrink:0;font-size:11px;padding:5px 8px;">✓</button>
    </div>`
  ).join('');
}

function initTooltips() {
  const portal = document.getElementById('tt-portal');
  const tbody  = document.getElementById('tbody');
  tbody.addEventListener('mouseover', e => {
    const tw = e.target.closest('.tw');
    if (!tw) return;
    const tb = tw.querySelector('.tb');
    if (!tb) return;
    portal.innerHTML = tb.innerHTML;
    portal.style.borderLeft = tb.style.borderLeft || '';
    const rect = tw.getBoundingClientRect();
    const cx = Math.max(108, Math.min(rect.left + rect.width / 2, window.innerWidth - 108));
    portal.style.left = cx + 'px';
    portal.style.transform = 'translateX(-50%)';
    if (rect.top < window.innerHeight / 2) {
      portal.style.top    = (rect.bottom + 8) + 'px';
      portal.style.bottom = '';
    } else {
      portal.style.top    = '';
      portal.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    }
    portal.classList.add('visible');
  });
  tbody.addEventListener('mouseout', e => {
    const tw = e.target.closest('.tw');
    if (!tw || tw.contains(e.relatedTarget)) return;
    portal.classList.remove('visible');
  });
}

['si','fi-csm','fi-kam','fi-tier','fi-health'].forEach(id => {
  document.getElementById(id).addEventListener('input', drawTable);
  document.getElementById(id).addEventListener('change', drawTable);
});
loadFromURL();
const _savedUser = localStorage.getItem('currentUser');
if (_savedUser) {
  document.getElementById('user-select').value = _savedUser;
  document.getElementById('fi-csm').value      = _savedUser;
  document.getElementById('admin-btn').style.display = '';
}
drawTable();
renderPriorities();
initialRenderDone = true;
initTooltips();
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--toolbar-h', document.getElementById('toolbar').offsetHeight + 'px');
}).observe(document.getElementById('toolbar'));

const _toolbar = document.getElementById('toolbar');
window.addEventListener('scroll', () => {
  _toolbar.classList.toggle('scrolled', window.scrollY > 100);
}, { passive: true });

function showSpTip(el) {
  const tb = el.querySelector('.tb');
  if (!tb) return;
  const rect = el.getBoundingClientRect();
  const cx = Math.max(108, Math.min(rect.left + rect.width / 2, window.innerWidth - 108));
  tb.style.left = cx + 'px';
  tb.style.transform = 'translateX(-50%)';
  tb.style.top = (rect.bottom + 8) + 'px';
  tb.style.bottom = 'auto';
  tb.style.visibility = 'visible';
  tb.style.opacity = '1';
}
function hideSpTip(el) {
  const tb = el.querySelector('.tb');
  if (tb) { tb.style.visibility = 'hidden'; tb.style.opacity = '0'; }
}

window.setTab = setTab;
window.toggleSort = toggleSort;
window.qa = qa;
window.openDetails = openDetails;
window.closeDetails = closeDetails;
window.resetFilters = resetFilters;
window.applyCurrentUser = applyCurrentUser;
window.setAdminView = setAdminView;
window.dismissPriority = dismissPriority;
window.setSupportPeriod = setSupportPeriod;
window.setSPTab = setSPTab;
window.drawTable = drawTable;
window.showSpTip = showSpTip;
window.hideSpTip = hideSpTip;
window.drillDown = drillDown;
