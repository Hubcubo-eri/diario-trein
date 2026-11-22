import { PROGRAMS, LEGACY_WORKOUT_MAP, MEALS, SUPPLEMENTS } from './data';
import { waterTotal, waterLog, dayActivities, activityMeta, FOOD_MEALS, foodTotals, INTENSITY, effectiveCal, fmtSleep } from './modules/BemEstar/helpers';

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function resolveWorkoutForPDF(dayData) {
  if (dayData.program && PROGRAMS[dayData.program]) {
    const prog = PROGRAMS[dayData.program];
    return prog.treinos[dayData.wk] || prog.treinos['treinoA'];
  }
  const map = LEGACY_WORKOUT_MAP[dayData.wk] || LEGACY_WORKOUT_MAP['treino1'];
  return PROGRAMS[map.program].treinos[map.treino];
}

export function generatePDF(dayData, dateStr, config, garmin) {
  const ex = dayData.ex || {}, mc = dayData.mc || {}, sp = dayData.sp || {}, sub = dayData.sub || {};
  const cal = effectiveCal(dayData, garmin), notes = dayData.notes || '';
  const supList = config?.supplements || SUPPLEMENTS;
  const workout = resolveWorkoutForPDF(dayData);
  const cA = parseInt(cal.a) || 0, cB = parseInt(cal.b) || 0, cT = parseInt(cal.t) || (cA + cB);
  const gm = garmin || null;
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
  if (gm) {
    const bb = gm.bodyBattery || {}, sl = gm.sleep || {};
    h += `<h2>Garmin</h2><div class="cb">
    <div class="ci"><div class="cv">${gm.steps != null ? gm.steps.toLocaleString('pt-BR') : '—'}</div><div class="cl">PASSOS</div></div>
    <div class="ci"><div class="cv">${fmtSleep(sl.min)}</div><div class="cl">SONO${sl.score ? ' · score ' + sl.score : ''}</div></div>
    <div class="ci"><div class="cv">${gm.rhr || '—'}</div><div class="cl">FC REPOUSO</div></div>
    <div class="ci"><div class="cv">${bb.max ?? '—'}</div><div class="cl">BODY BATTERY</div></div></div>`;
  }
  const da = dayActivities(dayData, garmin);
  if (da.length) {
    h += `<h2>Atividades</h2><table><tr><th>Atividade</th><th>Hora</th><th>Duração</th><th>Distância</th><th>Kcal</th><th>FC</th><th>Intensidade</th></tr>`;
    da.forEach(a => {
      const m = activityMeta(a.type);
      const it = INTENSITY.find(i => i.id === a.intensity);
      h += `<tr><td>${m.icon} ${esc(a.type === 'outra' && a.name ? a.name : m.label)}${a.notes ? `<br><span style="color:#888;font-size:9px">${esc(a.notes)}</span>` : ''}</td><td>${esc(a.t || '—')}</td><td>${a.dur ? esc(a.dur) + ' min' : '—'}</td><td>${a.dist ? esc(a.dist) + ' km' : '—'}</td><td>${esc(a.kcal || '—')}</td><td>${a.fc ? esc(a.fc) + ' bpm' : '—'}</td><td>${it ? it.label : '—'}</td></tr>`;
    });
    h += `</table>`;
  }
  const food = dayData.food || [];
  if (food.length) {
    const ft = foodTotals(dayData);
    h += `<h2>O que comi</h2><table><tr><th>Refeição</th><th>Hora</th><th>Descrição</th><th>Qtd</th><th>Kcal</th><th>Prot.</th></tr>`;
    FOOD_MEALS.forEach(m => food.filter(f => f.meal === m.id).sort((a, b) => (a.t || '').localeCompare(b.t || '')).forEach(f => {
      h += `<tr><td>${m.icon} ${m.label}${f.livre ? ' <b style="color:#b45309">(livre)</b>' : ''}</td><td>${esc(f.t || '—')}</td><td>${esc(f.desc)}</td><td>${esc(f.qty || '—')}</td><td>${esc(f.kcal || '—')}</td><td>${f.prot ? esc(f.prot) + 'g' : '—'}</td></tr>`;
    }));
    h += `</table>`;
    if (ft.kcal || ft.prot) h += `<p style="font-size:10px;margin-bottom:8px"><b>Total registrado:</b> ${Math.round(ft.kcal)} kcal · ${Math.round(ft.prot)}g proteína</p>`;
  }
  h += `<h2>Plano alimentar</h2>`;
  Object.values(MEALS).forEach(meal => {
    h += `<h3>${meal.icon} ${meal.name}</h3><table><tr><th>Alimento</th><th>Qtd</th><th>✓</th><th>Subst.</th></tr>`;
    meal.items.forEach(it => {
      h += `<tr><td>${it.name}</td><td>${it.qty}</td><td>${mc[it.id] ? '<span class="ck">✓</span>' : '<span class="ms">—</span>'}</td><td style="font-size:9px;color:#888">${sub[it.id] || '—'}</td></tr>`;
    });
    h += `</table>`;
    if (meal.obs) h += `<p style="font-size:9px;color:#b45309;margin-bottom:8px">⚠️ ${meal.obs}</p>`;
  });
  h += `<h2>Suplementos</h2><table><tr><th>Suplemento</th><th>Dose</th><th>Quando</th><th>Tomou</th></tr>`;
  supList.filter(s => !s.off || sp[s.id]).forEach(s => h += `<tr><td>${esc(s.name)}</td><td>${esc(s.qty)}</td><td>${esc(s.period)}</td><td>${sp[s.id] ? `<span class="ck">✓</span> ${esc(dayData.spT?.[s.id] || '')}` : '<span class="ms">—</span>'}</td></tr>`);
  (dayData.supExtra || []).forEach(x => h += `<tr><td>${esc(x.name)} <i style="color:#888">(avulso)</i></td><td>${esc(x.qty || '—')}</td><td>—</td><td><span class="ck">✓</span> ${esc(x.t || '')}</td></tr>`);
  h += `</table>`;
  if (workout) {
    h += `<h2>${workout.name}</h2>`;
    workout.sections.forEach(sec => {
      h += `<h3>${sec.name}</h3><table><tr><th>Exercício</th><th>S×R</th><th>Peso</th><th>✓</th></tr>`;
      sec.exercises.forEach(e => { const d = ex[e.id] || {}; h += `<tr><td>${e.name}</td><td>${e.sets}×${e.reps}</td><td>${e.hw && d.w ? d.w + 'kg' : '—'}</td><td>${d.done ? '<span class="ck">✓</span>' : '<span class="ms">—</span>'}</td></tr>`; });
      h += `</table>`;
    });
  }
  const tl = dayData.treinoLivre;
  if (tl && (tl.texto || tl.fotos?.length)) {
    h += `<h2>Treino do dia (registro livre)</h2>`;
    if (tl.dur || tl.kcal) h += `<p style="font-size:10px;margin-bottom:6px">${tl.dur ? `⏱ ${esc(tl.dur)} min ` : ''}${tl.kcal ? `🔥 ${esc(tl.kcal)} kcal` : ''}</p>`;
    if (tl.texto) h += `<div class="nb">${esc(tl.texto)}</div>`;
    if (tl.fotos?.length) h += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${tl.fotos.map(f => `<img src="${f}" style="height:160px;border-radius:6px">`).join('')}</div>`;
  }
  const wt = waterTotal(dayData);
  h += `<h2>Hidratação</h2><p><strong>💧 ${(wt / 1000).toFixed(2).replace('.', ',')} L</strong>${waterLog(dayData).filter(w => !w.legacy).length ? ` — ${waterLog(dayData).filter(w => !w.legacy).map(w => `${esc(w.t)} ${w.ml}ml`).join(' · ')}` : ''}</p>`;
  if (notes.trim()) h += `<h2>Observações</h2><div class="nb">${esc(notes)}</div>`;
  h += `<div class="ft">Cubo Saúde — Diário de Treino & Nutrição • ${dateStr}<br>Nutri: Bruna Siqueira Gama Rodrigues — CRN 46178</div></body></html>`;
  const blob = new Blob([h], { type: 'text/html' }); const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank'); if (w) setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 800);
}
