import { WORKOUTS, MEALS, SUPPLEMENTS, ACTIVITIES } from './data';

export function generatePDF(dayData, dateStr) {
  const { wk, ex, mc, act, notes, sp, water, sub, cal } = dayData;
  const workout = WORKOUTS[wk];
  const cA = parseInt(cal.a) || 0, cB = parseInt(cal.b) || 0, cT = parseInt(cal.t) || (cA + cB);
  let h = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1a1a2e;padding:36px;background:#fff;font-size:11px}
.hdr{display:flex;align-items:center;gap:14px;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #10b981}
.li{display:flex;gap:3px;flex-wrap:wrap;width:26px}.li span{width:10px;height:10px;background:#10b981;border-radius:2px;display:block}
.br{font-size:20px;font-weight:700;color:#10b981}.br em{font-weight:400;font-style:normal}.dt{font-size:12px;color:#666;margin-top:2px}
h2{font-size:14px;color:#10b981;margin:20px 0 8px;text-transform:uppercase;letter-spacing:1px}
h3{font-size:12px;color:#333;margin:12px 0 6px}
table{width:100%;border-collapse:collapse;margin-bottom:12px}
th{background:#10b981;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
td{padding:5px 8px;font-size:10px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#f9fafb}
.ck{color:#10b981;font-weight:700}.ms{color:#ccc}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.tag{background:#ecfdf5;color:#065f46;padding:4px 10px;border-radius:16px;font-size:10px}
.nb{background:#f9fafb;border-left:3px solid #10b981;padding:8px 12px;font-size:10px;margin-top:8px;white-space:pre-wrap}
.ft{margin-top:32px;padding-top:12px;border-top:2px solid #e5e7eb;font-size:8px;color:#999;text-align:center}
.cb{display:flex;gap:16px;margin:8px 0 16px}.ci{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 16px;text-align:center;flex:1}
.cv{font-size:20px;font-weight:700;color:#059669}.cl{font-size:9px;color:#6b7280;margin-top:2px}
@media print{body{padding:20px}@page{margin:1.5cm}}
</style></head><body>
<div class="hdr"><div class="li"><span></span><span></span><span></span><span></span></div>
<div><div class="br">cubo<em>saúde</em></div><div class="dt">Diário — ${dateStr}</div></div></div>`;
  if (cA || cB || cT) {
    h += `<h2>Calorias (Garmin)</h2><div class="cb">
    <div class="ci"><div class="cv">${cA || '—'}</div><div class="cl">ATIVAS</div></div>
    <div class="ci"><div class="cv">${cB || '—'}</div><div class="cl">BASAL</div></div>
    <div class="ci" style="border-color:#10b981"><div class="cv" style="color:#10b981">${cT || '—'}</div><div class="cl">TOTAL</div></div></div>`;
  }
  const da = ACTIVITIES.filter(a => act[a.id]);
  if (da.length) { h += `<h2>Atividades</h2><div class="tags">`; da.forEach(a => h += `<div class="tag">${a.icon} ${a.label}</div>`); h += `</div>`; }
  h += `<h2>Alimentação</h2>`;
  Object.values(MEALS).forEach(meal => {
    h += `<h3>${meal.icon} ${meal.name}</h3><table><tr><th>Alimento</th><th>Qtd</th><th>✓</th><th>Subst.</th></tr>`;
    meal.items.forEach(it => {
      h += `<tr><td>${it.name}</td><td>${it.qty}</td><td>${mc[it.id] ? '<span class="ck">✓</span>' : '<span class="ms">—</span>'}</td><td style="font-size:9px;color:#888">${sub[it.id] || '—'}</td></tr>`;
    });
    h += `</table>`;
    if (meal.obs) h += `<p style="font-size:9px;color:#b45309;margin-bottom:8px">⚠️ ${meal.obs}</p>`;
  });
  h += `<h2>Suplementos</h2><table><tr><th>Suplemento</th><th>Dose</th><th>Hora</th><th>✓</th></tr>`;
  SUPPLEMENTS.forEach(s => h += `<tr><td>${s.name}</td><td>${s.qty}</td><td>${s.period}</td><td>${sp[s.id] ? '<span class="ck">✓</span>' : '<span class="ms">—</span>'}</td></tr>`);
  h += `</table>`;
  if (workout) {
    h += `<h2>${workout.name}</h2>`;
    workout.sections.forEach(sec => {
      h += `<h3>${sec.name}</h3><table><tr><th>Exercício</th><th>S×R</th><th>Peso</th><th>✓</th></tr>`;
      sec.exercises.forEach(e => { const d = ex[e.id] || {}; h += `<tr><td>${e.name}</td><td>${e.sets}×${e.reps}</td><td>${e.hw && d.w ? d.w + 'kg' : '—'}</td><td>${d.done ? '<span class="ck">✓</span>' : '<span class="ms">—</span>'}</td></tr>`; });
      h += `</table>`;
    });
  }
  h += `<div style="margin-top:8px"><strong>💧 Hidratação:</strong> ${water}/8 copos</div>`;
  if (notes.trim()) h += `<h2>Observações</h2><div class="nb">${notes}</div>`;
  h += `<div class="ft">Cubo Saúde — Diário de Treino & Nutrição • ${dateStr}<br>Nutri: Bruna Siqueira Gama Rodrigues — CRN 46178</div></body></html>`;
  const blob = new Blob([h], { type: 'text/html' }); const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank'); if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 800);
}
