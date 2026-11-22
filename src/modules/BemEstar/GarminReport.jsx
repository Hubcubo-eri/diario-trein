import { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dk, fmtSleep, activityMeta, haptic } from './helpers';

// ─── Traduções dos códigos do Garmin ──────────────────────────────────────
const HRV_STATUS = { BALANCED: 'Equilibrada', UNBALANCED: 'Desequilibrada', LOW: 'Baixa', POOR: 'Ruim', NONE: '—' };
const READINESS = { PRIME: 'Ótima', HIGH: 'Alta', MODERATE: 'Moderada', LOW: 'Baixa', POOR: 'Ruim' };
const TRAINING = [
  ['PRODUCTIVE', 'Produtivo'], ['MAINTAINING', 'Manutenção'], ['RECOVERY', 'Recuperação'],
  ['UNPRODUCTIVE', 'Improdutivo'], ['DETRAINING', 'Destreino'], ['PEAKING', 'Pico'],
  ['OVERREACHING', 'Sobrecarga'], ['STRAINED', 'Desgaste'],
];
export const trHrv = (s) => HRV_STATUS[s] || s || '—';
export const trReadiness = (s) => READINESS[s] || s || '—';
export const trTraining = (s) => {
  if (!s) return '—';
  const hit = TRAINING.find(([k]) => String(s).toUpperCase().startsWith(k));
  return hit ? hit[1] : String(s);
};

// ─── Utilitários ──────────────────────────────────────────────────────────
const avg = (arr) => {
  const v = arr.filter(x => typeof x === 'number' && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const sum = (arr) => arr.filter(x => typeof x === 'number').reduce((a, b) => a + b, 0);
const nf = (v, d = 0) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d }));
// Eixo compacto: 12.500 -> 12,5k (não corta no celular)
const compact = (v) => (Math.abs(v) >= 1000 ? `${nf(v / 1000, v % 1000 ? 1 : 0)}k` : nf(v));
const ddmm = (k) => `${k.slice(8, 10)}/${k.slice(5, 7)}`;

const PERIODS = [
  { id: 7, label: '7 dias' },
  { id: 30, label: '30 dias' },
  { id: 90, label: '3 meses' },
  { id: 365, label: '1 ano' },
  { id: 0, label: 'Tudo' },
];

// Cada métrica = um gráfico próprio (nunca dois eixos no mesmo gráfico)
const METRICS = [
  { id: 'steps', title: 'Passos', icon: '👣', color: '#10b981', type: 'bar', get: g => g.steps, fmt: v => nf(v), agg: 'avg', better: 'up' },
  { id: 'sleep', title: 'Sono', icon: '😴', color: '#818cf8', type: 'bar', get: g => g.sleep?.min, fmt: v => fmtSleep(Math.round(v)), axis: v => `${Math.round(v / 60)}h`, ticks: [0, 120, 240, 360, 480, 600], agg: 'avg', better: 'up' },
  { id: 'sleepScore', title: 'Score do sono', icon: '⭐', color: '#a78bfa', type: 'line', get: g => g.sleep?.score, fmt: v => nf(v), agg: 'avg', better: 'up' },
  { id: 'readiness', title: 'Prontidão p/ treino', icon: '🚦', color: '#fbbf24', type: 'line', get: g => g.readiness?.score, fmt: v => nf(v), agg: 'avg', better: 'up' },
  { id: 'hrv', title: 'VFC (noite)', icon: '💓', color: '#38bdf8', type: 'line', get: g => g.hrv?.night, fmt: v => `${nf(v)} ms`, agg: 'avg', better: 'up' },
  { id: 'rhr', title: 'FC de repouso', icon: '❤️', color: '#f87171', type: 'line', get: g => g.rhr, fmt: v => `${nf(v)} bpm`, agg: 'avg', better: 'down' },
  { id: 'bb', title: 'Body Battery (máx.)', icon: '🔋', color: '#34d399', type: 'bar', get: g => g.bodyBattery?.max, fmt: v => nf(v), agg: 'avg', better: 'up' },
  { id: 'stress', title: 'Estresse médio', icon: '🧠', color: '#fb923c', type: 'line', get: g => (g.stress >= 0 ? g.stress : null), fmt: v => nf(v), agg: 'avg', better: 'down' },
  { id: 'kcal', title: 'Calorias ativas', icon: '🔥', color: '#f59e0b', type: 'bar', get: g => g.cal?.a, fmt: v => `${nf(v)} kcal`, agg: 'avg', better: 'up' },
  { id: 'intensity', title: 'Minutos de intensidade', icon: '⚡', color: '#22d3ee', type: 'bar', get: g => (g.intensityMin ? (g.intensityMin.mod || 0) + 2 * (g.intensityMin.vig || 0) : null), fmt: v => `${nf(v)} min`, agg: 'sum', better: 'up', note: 'vigorosos contam em dobro (padrão OMS)' },
  { id: 'weight', title: 'Peso', icon: '⚖️', color: '#e5e7eb', type: 'line', get: g => g.body?.weightKg, fmt: v => `${nf(v, 1)} kg`, agg: 'last', better: null },
  { id: 'vo2', title: 'VO2 máx.', icon: '🫁', color: '#2dd4bf', type: 'line', get: g => g.training?.vo2max, fmt: v => nf(v, 1), agg: 'last', better: 'up' },
];

const card = { background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 14px 10px', border: '1px solid rgba(255,255,255,0.06)' };
const sectionTitle = { fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5, margin: '22px 0 10px' };

function TooltipBox({ active, payload, label, metric }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#e5e7eb' }}>
      <div style={{ color: '#9ca3af', fontSize: 10 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{metric.fmt(payload[0].value)}</div>
    </div>
  );
}

function MetricChart({ metric, rows, prevRows }) {
  const data = rows.map(r => ({ d: ddmm(r.k), v: metric.get(r.g) ?? null }));
  const vals = data.map(x => x.v).filter(v => v != null);
  if (!vals.length) return null;

  const headline = metric.agg === 'last' ? vals[vals.length - 1] : metric.agg === 'sum' ? sum(vals) / Math.max(1, Math.ceil(rows.length / 7)) : avg(vals);
  const prevVals = prevRows.map(r => metric.get(r.g)).filter(v => v != null);
  const prev = metric.agg === 'last' ? prevVals[prevVals.length - 1] : metric.agg === 'sum' ? (prevVals.length ? sum(prevVals) / Math.max(1, Math.ceil(prevRows.length / 7)) : null) : avg(prevVals);
  let trend = null;
  if (prev != null && headline != null && prev !== 0) {
    const pct = ((headline - prev) / Math.abs(prev)) * 100;
    if (Math.abs(pct) >= 1) {
      const good = metric.better ? (metric.better === 'up' ? pct > 0 : pct < 0) : null;
      trend = { pct, good };
    }
  }
  const label = metric.agg === 'last' ? 'atual' : metric.agg === 'sum' ? 'por semana' : 'média';
  const dense = data.length > 45;

  return (
    <div style={{ ...card, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: metric.color, display: 'inline-block' }} />
            {metric.icon} {metric.title}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb', marginTop: 2 }}>
            {metric.fmt(headline)} <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{label}</span>
          </div>
          {metric.note && <div style={{ fontSize: 10, color: '#6b7280' }}>{metric.note}</div>}
        </div>
        {trend && (
          <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap',
            background: trend.good == null ? 'rgba(255,255,255,0.06)' : trend.good ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: trend.good == null ? '#9ca3af' : trend.good ? '#34d399' : '#f87171' }}>
            {trend.pct > 0 ? '▲' : '▼'} {nf(Math.abs(trend.pct))}% <span style={{ fontWeight: 400, color: '#9ca3af' }}>vs. anterior</span>
          </div>
        )}
      </div>
      <div style={{ height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          {metric.type === 'bar' ? (
            <BarChart data={data} margin={{ top: 6, right: 4, left: -8, bottom: 0 }} barCategoryGap={dense ? 1 : 3}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="d" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} width={36} ticks={metric.ticks} domain={metric.ticks ? [0, 'dataMax'] : undefined} tickFormatter={metric.axis || compact} />
              <Tooltip content={<TooltipBox metric={metric} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="v" fill={metric.color} radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={false} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 6, right: 6, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="d" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} width={36} domain={['auto', 'auto']} tickFormatter={v => nf(v, metric.id === 'weight' || metric.id === 'vo2' ? 1 : 0)} />
              <Tooltip content={<TooltipBox metric={metric} />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
              <Line dataKey="v" stroke={metric.color} strokeWidth={2} connectNulls dot={data.length <= 14 ? { r: 3, fill: metric.color, stroke: '#0a0a0f', strokeWidth: 2 } : false} activeDot={{ r: 5, stroke: '#0a0a0f', strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Faixa compacta na tela inicial ───────────────────────────────────────
export function GarminStrip({ g, onOpen }) {
  if (!g) {
    return (
      <button onClick={onOpen} style={{ width: '100%', marginTop: 10, padding: '8px 12px', borderRadius: 12, border: '1px dashed rgba(14,165,233,0.25)', background: 'transparent', color: '#6b7280', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>
        ⌚ Sem dados do Garmin para este dia · ver relatório →
      </button>
    );
  }
  const items = [
    { i: '🚦', v: g.readiness?.score ?? '—', l: 'prontidão' },
    { i: '😴', v: fmtSleep(g.sleep?.min), l: g.sleep?.score ? `score ${g.sleep.score}` : 'sono' },
    { i: '🔋', v: g.bodyBattery?.max ?? '—', l: 'body batt.' },
    { i: '💓', v: g.hrv?.night ?? '—', l: 'VFC ms' },
    { i: '👣', v: g.steps != null ? (g.steps >= 1000 ? `${(g.steps / 1000).toFixed(1).replace('.', ',')}k` : g.steps) : '—', l: 'passos' },
  ];
  return (
    <button onClick={() => { haptic('light'); onOpen(); }}
      style={{ width: '100%', marginTop: 10, padding: '10px 6px 8px', borderRadius: 14, border: '1px solid rgba(14,165,233,0.22)', background: 'rgba(14,165,233,0.06)', cursor: 'pointer', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, position: 'relative' }}>
      {items.map(x => (
        <div key={x.l} style={{ textAlign: 'center', minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb', whiteSpace: 'nowrap' }}><span style={{ fontSize: 12 }}>{x.i}</span> {x.v}</div>
          <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.l}</div>
        </div>
      ))}
    </button>
  );
}

// ─── Relatório completo ───────────────────────────────────────────────────
export function GarminReport({ garmin, onClose }) {
  const [period, setPeriod] = useState(30);
  const [showTable, setShowTable] = useState(false);

  const allKeys = useMemo(() => Object.keys(garmin || {}).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort(), [garmin]);

  const { rows, prevRows } = useMemo(() => {
    if (!allKeys.length) return { rows: [], prevRows: [] };
    if (!period) return { rows: allKeys.map(k => ({ k, g: garmin[k] })), prevRows: [] };
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - (period - 1));
    const pStart = new Date(start); pStart.setDate(start.getDate() - period);
    const s = dk(start), ps = dk(pStart);
    return {
      rows: allKeys.filter(k => k >= s).map(k => ({ k, g: garmin[k] })),
      prevRows: allKeys.filter(k => k >= ps && k < s).map(k => ({ k, g: garmin[k] })),
    };
  }, [allKeys, period, garmin]);

  const latest = rows.length ? rows[rows.length - 1].g : null;

  // Atividades do período agrupadas por tipo
  const byType = useMemo(() => {
    const m = {};
    rows.forEach(({ g }) => (g.activities || []).forEach(a => {
      const t = m[a.type] || (m[a.type] = { type: a.type, n: 0, min: 0, km: 0, kcal: 0 });
      t.n++; t.min += Number(a.dur) || 0; t.km += Number(a.dist) || 0; t.kcal += Number(a.kcal) || 0;
    }));
    return Object.values(m).sort((a, b) => b.min - a.min);
  }, [rows]);
  const totalActs = byType.reduce((a, t) => a + t.n, 0);
  const totalActMin = byType.reduce((a, t) => a + t.min, 0);

  const sleepStages = useMemo(() => ({
    deep: avg(rows.map(r => r.g.sleep?.deepMin)), light: avg(rows.map(r => r.g.sleep?.lightMin)),
    rem: avg(rows.map(r => r.g.sleep?.remMin)), awake: avg(rows.map(r => r.g.sleep?.awakeMin)),
  }), [rows]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif", padding: '20px 16px 60px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 14, cursor: 'pointer', fontWeight: 600, padding: 0 }}>← Voltar</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#f9fafb' }}>⌚ Relatório Garmin</div>
        <div style={{ width: 56 }} />
      </div>

      {!allKeys.length ? (
        <div style={{ ...card, textAlign: 'center', padding: 24, lineHeight: 1.6 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⌚</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>Nenhum dado do Garmin ainda</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Faça a configuração descrita em <b>garmin/README.md</b> (login no computador + 2 secrets no GitHub) e rode o Action
            “Garmin → Diário”. Para trazer o histórico, preencha a data inicial ao rodar.
          </div>
        </div>
      ) : (
        <>
          {/* Filtro de período — uma linha acima dos gráficos */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => { haptic('light'); setPeriod(p.id); }}
                style={{ padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  border: `1px solid ${period === p.id ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  background: period === p.id ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.03)', color: period === p.id ? '#10b981' : '#9ca3af' }}>
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
            {rows.length} dia(s) com dados{rows.length ? ` · ${ddmm(rows[0].k)} a ${ddmm(rows[rows.length - 1].k)}` : ''}
            {period ? ' · comparação com o período anterior' : ''}
          </div>

          {/* Estado atual */}
          {latest && (
            <>
              <div style={sectionTitle}>Agora</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { l: '🚦 Prontidão', v: latest.readiness?.score ?? '—', s: trReadiness(latest.readiness?.level) + (latest.readiness?.recoveryH ? ` · recuperação ${latest.readiness.recoveryH}h` : '') },
                  { l: '💓 VFC', v: latest.hrv?.night ? `${latest.hrv.night} ms` : '—', s: `${trHrv(latest.hrv?.status)}${latest.hrv?.week ? ` · semana ${latest.hrv.week} ms` : ''}` },
                  { l: '🏋️ Status de treino', v: trTraining(latest.training?.status), s: latest.training?.acuteLoad ? `carga aguda ${latest.training.acuteLoad}` : '' },
                  { l: '🫁 VO2 máx.', v: latest.training?.vo2max ? nf(latest.training.vo2max, 1) : '—', s: latest.body?.weightKg ? `peso ${nf(latest.body.weightKg, 1)} kg` : '' },
                ].map(x => (
                  <div key={x.l} style={card}>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{x.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', marginTop: 2 }}>{x.v}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, minHeight: 13 }}>{x.s}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Atividades */}
          <div style={sectionTitle}>Atividades no período</div>
          {byType.length === 0 ? (
            <div style={{ ...card, fontSize: 12, color: '#6b7280' }}>Nenhuma atividade registrada no relógio.</div>
          ) : (
            <div style={card}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                <b style={{ color: '#f9fafb' }}>{totalActs}</b> atividades · <b style={{ color: '#f9fafb' }}>{fmtSleep(totalActMin)}</b> no total
              </div>
              {byType.map(t => {
                const m = activityMeta(t.type);
                return (
                  <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{m.label} <span style={{ color: '#6b7280', fontWeight: 400 }}>× {t.n}</span></div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {[fmtSleep(t.min), t.km ? `${nf(t.km, 1)} km` : null, t.kcal ? `${nf(t.kcal)} kcal` : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ width: 70, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(t.min / byType[0].min) * 100}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Gráficos — um por métrica */}
          <div style={sectionTitle}>Evolução</div>
          {METRICS.map(m => <MetricChart key={m.id} metric={m} rows={rows} prevRows={prevRows} />)}

          {sleepStages.deep != null && (
            <div style={{ ...card, marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>😴 Fases do sono (média por noite)</div>
              {[['Profundo', sleepStages.deep], ['Leve', sleepStages.light], ['REM', sleepStages.rem], ['Acordado', sleepStages.awake]].filter(([, v]) => v != null).map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span style={{ color: '#9ca3af' }}>{l}</span><span style={{ color: '#f9fafb', fontWeight: 600 }}>{fmtSleep(Math.round(v))}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabela dia a dia */}
          <div style={sectionTitle}>Dia a dia</div>
          <button onClick={() => setShowTable(v => !v)}
            style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
            {showTable ? 'Ocultar tabela' : `Ver tabela (${rows.length} dias)`}
          </button>
          {showTable && (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 560, width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {['Data', 'Passos', 'Sono', 'Score', 'Pront.', 'VFC', 'FC rep.', 'BB máx', 'Kcal at.', 'Ativ.'].map(h => (
                      <th key={h} style={{ padding: '8px 6px', textAlign: h === 'Data' ? 'left' : 'right', color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap', position: h === 'Data' ? 'sticky' : 'static', left: 0, background: h === 'Data' ? '#15151d' : undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map(({ k, g }) => (
                    <tr key={k} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '7px 6px', color: '#e5e7eb', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#111118' }}>{ddmm(k)}</td>
                      {[nf(g.steps), fmtSleep(g.sleep?.min), g.sleep?.score ?? '—', g.readiness?.score ?? '—', g.hrv?.night ?? '—', g.rhr ?? '—', g.bodyBattery?.max ?? '—', nf(g.cal?.a), (g.activities || []).map(a => activityMeta(a.type).icon).join('') || '—'].map((v, i) => (
                        <td key={i} style={{ padding: '7px 6px', textAlign: 'right', color: '#d1d5db', whiteSpace: 'nowrap' }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
