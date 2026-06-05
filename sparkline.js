export function renderSparkline(history, options = {}) {
  const W = 72, H = 22, PAD = 2;
  const n = history.length;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const pts = history.map((v, i) => [
    PAD + (i / (n - 1)) * (W - PAD * 2),
    PAD + (1 - (v - min) / range) * (H - PAD * 2),
  ]);

  const diff = history[n - 1] - history[0];
  // Stable if net change < 3 pts; invert logic for risk (rising risk = bad)
  let rising = Math.abs(diff) >= 3 ? diff > 0 : null;
  if (options.invertColor && rising !== null) rising = !rising;
  const color = rising === null ? '#94a3b8' : rising ? '#10b981' : '#ef4444';

  const linePts = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const fillPts = [
    ...pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`),
    `${pts[n - 1][0].toFixed(1)},${(H - PAD).toFixed(1)}`,
    `${pts[0][0].toFixed(1)},${(H - PAD).toFixed(1)}`,
  ].join(' ');
  const [cx, cy] = pts[n - 1];

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;"><polygon points="${fillPts}" fill="${color}" fill-opacity="0.1" stroke="none"/><polyline points="${linePts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.5" fill="${color}"/></svg>`;
}
