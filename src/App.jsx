import { useState, useEffect, useRef } from 'react';
import { WORKOUTS, MEALS, SUPPLEMENTS, ACTIVITIES, TOTAL_MEALS, emptyDay } from './data';
import { loadAllData, saveDay as saveDayDB, exportAllData } from './storage';
import { generatePDF } from './pdf';
import { DashboardEvolucao } from './DashboardEvolucao';

function dk(d) { return d.toISOString().slice(0, 10); }
function datePretty(d) { return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }); }
function dateFull(d) { return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }

const APP_PIN = '0811';
const AUTH_KEY = 'cubo-diario-auth';

function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (next === APP_PIN) {
        localStorage.setItem(AUTH_KEY, 'true');
        onSuccess();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); }, 600);
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 16 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} />)}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
        cubo<span style={{ fontWeight: 300 }}>saúde</span>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 32 }}>Digite o PIN para acessar</div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 12, animation: shake ? 'shake 0.4s' : 'none' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            background: i < pin.length ? (error ? '#ef4444' : '#10b981') : 'transparent',
            border: `2px solid ${error ? '#ef4444' : i < pin.length ? '#10b981' : '#4b5563'}`,
            transition: 'all 0.15s',
          }} />
        ))}
      </div>
      {error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>PIN incorreto</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20, maxWidth: 260 }}>
        {[1,2,3,4,5,6,7,8,9,null,0,'⌫'].map((d, i) => (
          d === null ? <div key={i} /> :
          <button key={i}
            onClick={() => d === '⌫' ? handleDelete() : handleDigit(String(d))}
            style={{
              width: 68, height: 68, borderRadius: '50%', border: 'none',
              background: d === '⌫' ? 'transparent' : 'rgba(255,255,255,0.06)',
              color: d === '⌫' ? '#6b7280' : '#e5e7eb',
              fontSize: d === '⌫' ? 22 : 24, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}>
            {d}
          </button>
        ))}
      </div>
      <style>{`@keyframes shake { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-8px) } 40%,80% { transform: translateX(8px) } }`}</style>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');

  if (!authed) return <PinScreen onSuccess={() => setAuthed(true)} />;

  return <MainApp />;
}

function MainApp() {
  const [date, setDate] = useState(new Date());
  const [allData, setAllData] = useState({});
  const [tab, setTab] = useState('treino');
  const [expMeal, setExpMeal] = useState(null);
  const [showMsg, setShowMsg] = useState(true);
  const [view, setView] = useState('today');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const skipSave = useRef(true);

  const key = dk(date);
  const day = allData[key] || emptyDay();

  // Load all data from Supabase on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadAllData();
      setAllData(data);
      setLoading(false);
      setTimeout(() => { skipSave.current = false; }, 300);
    })();
  }, []);

  // Auto-save current day to Supabase
  useEffect(() => {
    if (loading || skipSave.current) return;
    const currentDay = allData[key];
    if (!currentDay) return;

    const t = setTimeout(async () => {
      setStatus('saving');
      const ok = await saveDayDB(key, currentDay);
      setStatus(ok ? 'saved' : 'error');
      setTimeout(() => setStatus(''), 1500);
    }, 600);
    return () => clearTimeout(t);
  }, [allData, key, loading]);

  const setDay = (fn) => {
    setAllData(prev => {
      const current = prev[key] || emptyDay();
      const updated = typeof fn === 'function' ? fn(current) : fn;
      return { ...prev, [key]: updated };
    });
  };

  const updateEx = (id, f, v) => setDay(d => ({ ...d, ex: { ...d.ex, [id]: { ...d.ex[id], [f]: v } } }));
  const toggleMc = (id) => setDay(d => ({ ...d, mc: { ...d.mc, [id]: !d.mc[id] } }));
  const toggleSp = (id) => setDay(d => ({ ...d, sp: { ...d.sp, [id]: !d.sp[id] } }));
  const toggleAct = (id) => setDay(d => ({ ...d, act: { ...d.act, [id]: !d.act[id] } }));
  const setWater = (n) => setDay(d => ({ ...d, water: n }));
  const setCal = (f, v) => setDay(d => ({ ...d, cal: { ...d.cal, [f]: v } }));
  const setSub = (id, v) => setDay(d => ({ ...d, sub: { ...d.sub, [id]: v } }));
  const setNotes = (v) => setDay(d => ({ ...d, notes: v }));
  const setWk = (v) => setDay(d => ({ ...d, wk: v }));

  const chgDate = (off) => {
    const d = new Date(date); d.setDate(d.getDate() + off);
    if (d <= new Date()) setDate(d);
  };

  const workout = WORKOUTS[day.wk || 'treino1'];
  const tEx = workout.sections.reduce((a, s) => a + s.exercises.length, 0);
  const dEx = workout.sections.reduce((a, s) => a + s.exercises.filter(e => day.ex[e.id]?.done).length, 0);
  const dM = Object.keys(day.mc).filter(k => day.mc[k]).length;
  const dS = Object.keys(day.sp).filter(k => day.sp[k]).length;

  const cs = { background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)' };
  const ls = { fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: '#10b981', animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <div style={{ color: '#10b981', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Carregando dados...</div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </div>
  );

  const statusBadge = status && (
    <div style={{ position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 100, padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: status === 'saved' ? 'rgba(16,185,129,0.9)' : status === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.15)', color: '#fff' }}>
      {status === 'saving' ? '☁️ Salvando...' : status === 'saved' ? '☁️ ✓ Salvo' : '✗ Erro ao salvar'}
    </div>
  );

  // ── HISTORY ──
  if (view === 'history') {
    const days = Object.keys(allData).sort().reverse();
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', padding: '20px 20px 40px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => setView('today')} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>← Voltar</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb' }}>Histórico</div>
          <button onClick={exportAllData} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', padding: '6px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>💾</button>
        </div>
        {days.length === 0 && <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 60 }}>Nenhum registro ainda</div>}
        {days.map(k => {
          const d = allData[k]; const dt = new Date(k + 'T12:00:00');
          const w = WORKOUTS[d.wk || 'treino1'];
          const te = w.sections.reduce((a, s) => a + s.exercises.length, 0);
          const de = w.sections.reduce((a, s) => a + s.exercises.filter(e => (d.ex || {})[e.id]?.done).length, 0);
          const dm = Object.keys(d.mc || {}).filter(x => d.mc[x]).length;
          const ds = Object.keys(d.sp || {}).filter(x => d.sp[x]).length;
          const acts = ACTIVITIES.filter(a => (d.act || {})[a.id]);
          const c = d.cal || {}; const ct = parseInt(c.t) || ((parseInt(c.a) || 0) + (parseInt(c.b) || 0));
          return (
            <div key={k} style={{ ...cs, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb', textTransform: 'capitalize' }}>{datePretty(dt)}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{d.wk === 'treino2' ? 'Treino 2' : 'Treino 1'}</div>
                </div>
                <button onClick={() => generatePDF(d, dateFull(dt))} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📄</button>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: de === te ? '#10b981' : '#9ca3af' }}>💪 {de}/{te}</span>
                <span style={{ fontSize: 11, color: dm === TOTAL_MEALS ? '#10b981' : '#9ca3af' }}>🥗 {dm}/{TOTAL_MEALS}</span>
                <span style={{ fontSize: 11, color: ds === SUPPLEMENTS.length ? '#10b981' : '#9ca3af' }}>💊 {ds}/{SUPPLEMENTS.length}</span>
                <span style={{ fontSize: 11, color: '#0ea5e9' }}>💧 {d.water || 0}/8</span>
                {ct > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>🔥 {ct}</span>}
              </div>
              {acts.length > 0 && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>{acts.map(a => <span key={a.id} style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 10 }}>{a.icon}</span>)}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  // ── MAIN ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <div style={{ position: 'fixed', top: -120, right: -120, width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      {statusBadge}

      <div style={{ padding: '20px 20px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />)}
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#10b981', letterSpacing: -0.5 }}>cubo<span style={{ fontWeight: 300 }}>saúde</span></span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView('history')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📊</button>
            <button onClick={() => generatePDF(day, dateFull(date))} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>📄</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <button onClick={() => chgDate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', width: 36, height: 36, borderRadius: 10, fontSize: 16, cursor: 'pointer' }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{dateFull(date)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb' }}>Foco no Bucho! 🔥</div>
          </div>
          <button onClick={() => chgDate(1)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: dk(new Date()) === key ? '#2a2a2a' : '#9ca3af', width: 36, height: 36, borderRadius: 10, fontSize: 16, cursor: dk(new Date()) === key ? 'default' : 'pointer' }}>›</button>
        </div>

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Treino', v: `${dEx}/${tEx}`, p: tEx ? (dEx/tEx)*100 : 0 },
            { l: 'Dieta', v: `${dM}/${TOTAL_MEALS}`, p: TOTAL_MEALS ? (dM/TOTAL_MEALS)*100 : 0 },
            { l: 'Suplem.', v: `${dS}/${SUPPLEMENTS.length}`, p: (dS/SUPPLEMENTS.length)*100 },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.p === 100 ? '#10b981' : '#f9fafb' }}>{s.v}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.p}%`, background: '#10b981', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showMsg && (
        <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 11, color: '#6ee7b7', lineHeight: 1.5, flex: 1 }}>
            <strong style={{ color: '#10b981' }}>Recado:</strong> Surf em jejum. Jantar 1ª hora pós-treino. 2 livres/semana. Não pule o core! 💪
          </div>
          <button onClick={() => setShowMsg(false)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16, padding: 4, marginLeft: 8 }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, padding: '12px 20px', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(16px)' }}>
        {[{ id: 'treino', l: 'Treino', i: '💪' }, { id: 'comida', l: 'Dieta', i: '🥗' }, { id: 'dia', l: 'Dia', i: '📋' }, { id: 'evolucao', l: 'Evolução', i: '📊' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === t.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
              color: tab === t.id ? '#10b981' : '#6b7280',
              border: tab === t.id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent' }}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px 120px', position: 'relative', zIndex: 1 }}>

        {tab === 'treino' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {Object.keys(WORKOUTS).map(k => (
                <button key={k} onClick={() => setWk(k)}
                  style={{ flex: 1, padding: '12px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: day.wk === k ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.04)',
                    color: day.wk === k ? '#fff' : '#9ca3af' }}>
                  {k === 'treino1' ? 'Treino 1' : 'Treino 2'}
                </button>
              ))}
            </div>
            {workout.sections.map(sec => (
              <div key={sec.name} style={{ marginBottom: 24 }}>
                <div style={ls}>{sec.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sec.exercises.map(e => {
                    const d = day.ex[e.id] || {};
                    return (
                      <div key={e.id} style={{ ...cs, background: d.done ? 'rgba(16,185,129,0.06)' : cs.background, border: d.done ? '1px solid rgba(16,185,129,0.2)' : cs.border }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: d.done ? '#10b981' : '#e5e7eb', textDecoration: d.done ? 'line-through' : 'none', opacity: d.done ? 0.8 : 1 }}>{e.name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{e.sets}×{e.reps} • 1' desc.</div>
                          </div>
                          <button onClick={() => updateEx(e.id, 'done', !d.done)}
                            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: d.done ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', color: d.done ? '#fff' : '#4b5563', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {d.done ? '✓' : '○'}
                          </button>
                        </div>
                        {e.hw && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, color: '#6b7280' }}>Peso:</span>
                            <input type="number" placeholder="kg" value={d.w || ''} onChange={ev => updateEx(e.id, 'w', ev.target.value)}
                              style={{ width: 80, padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 13, outline: 'none' }} />
                            <span style={{ fontSize: 11, color: '#4b5563' }}>kg</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'comida' && (
          <div>
            <div style={ls}>Hidratação</div>
            <div style={{ ...cs, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <button key={i} onClick={() => setWater(i < day.water ? i : i + 1)}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i < day.water ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'rgba(255,255,255,0.06)',
                      color: i < day.water ? '#fff' : '#4b5563',
                      boxShadow: i < day.water ? '0 2px 8px rgba(14,165,233,0.3)' : 'none' }}>💧</button>
                ))}
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: day.water >= 8 ? '#0ea5e9' : '#6b7280' }}>{day.water}/8</span>
            </div>

            {Object.entries(MEALS).map(([mk, meal]) => (
              <div key={mk} style={{ marginBottom: 10 }}>
                <button onClick={() => setExpMeal(expMeal === mk ? null : mk)}
                  style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: expMeal === mk ? '12px 12px 0 0' : 12, padding: '12px 14px', cursor: 'pointer', color: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{meal.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{meal.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{meal.items.filter(it => day.mc[it.id]).length}/{meal.items.length}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {meal.items.every(it => day.mc[it.id]) && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>✓</span>}
                    <span style={{ fontSize: 18, color: '#6b7280', transform: expMeal === mk ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                  </div>
                </button>
                {expMeal === mk && (
                  <div style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                    {meal.items.map(item => (
                      <div key={item.id} style={{ background: day.mc[item.id] ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: day.mc[item.id] ? '#10b981' : '#e5e7eb', textDecoration: day.mc[item.id] ? 'line-through' : 'none' }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>{item.qty}</div>
                          </div>
                          <button onClick={() => toggleMc(item.id)}
                            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: day.mc[item.id] ? '#10b981' : 'rgba(255,255,255,0.06)', color: day.mc[item.id] ? '#fff' : '#4b5563', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {day.mc[item.id] ? '✓' : '○'}
                          </button>
                        </div>
                        {item.subs && (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ fontSize: 10, color: '#6b7280' }}>Subst.: {item.subs}</div>
                            <input type="text" placeholder="Usou qual?" value={day.sub[item.id] || ''}
                              onChange={e => setSub(item.id, e.target.value)}
                              style={{ width: '100%', marginTop: 4, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#e5e7eb', fontSize: 11, outline: 'none' }} />
                          </div>
                        )}
                      </div>
                    ))}
                    {meal.obs && <div style={{ padding: '8px 14px', background: 'rgba(234,179,8,0.06)', fontSize: 11, color: '#fbbf24' }}>⚠️ {meal.obs}</div>}
                  </div>
                )}
              </div>
            ))}

            <div style={{ ...ls, marginTop: 24 }}>Suplementos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUPPLEMENTS.map(s => (
                <div key={s.id} style={{ ...cs, background: day.sp[s.id] ? 'rgba(16,185,129,0.06)' : cs.background, border: day.sp[s.id] ? '1px solid rgba(16,185,129,0.2)' : cs.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: day.sp[s.id] ? '#10b981' : '#e5e7eb' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{s.qty} • {s.period}</div>
                  </div>
                  <button onClick={() => toggleSp(s.id)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: day.sp[s.id] ? '#10b981' : 'rgba(255,255,255,0.06)', color: day.sp[s.id] ? '#fff' : '#4b5563', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {day.sp[s.id] ? '✓' : '○'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'dia' && (
          <div>
            <div style={ls}>Calorias — Garmin ⌚</div>
            <div style={{ ...cs, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { k: 'a', l: 'Ativas', c: '#f59e0b', i: '🔥' },
                  { k: 'b', l: 'Basal', c: '#8b5cf6', i: '💤' },
                  { k: 't', l: 'Total', c: '#10b981', i: '⚡' },
                ].map(c => (
                  <div key={c.k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>{c.i} {c.l}</div>
                    <input type="number" placeholder="kcal" value={day.cal[c.k] || ''}
                      onChange={e => setCal(c.k, e.target.value)}
                      style={{ width: '100%', padding: '10px 6px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.c}33`, borderRadius: 10, color: c.c, fontSize: 18, fontWeight: 700, outline: 'none' }} />
                    <div style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>kcal</div>
                  </div>
                ))}
              </div>
              {(day.cal.a && day.cal.b && !day.cal.t) && (
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                  Total: {(parseInt(day.cal.a) || 0) + (parseInt(day.cal.b) || 0)} kcal
                </div>
              )}
            </div>

            <div style={ls}>Atividades</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
              {ACTIVITIES.map(a => (
                <button key={a.id} onClick={() => toggleAct(a.id)}
                  style={{ padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: 'none',
                    background: day.act[a.id] ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                    border: day.act[a.id] ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 20 }}>{a.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: day.act[a.id] ? '#10b981' : '#9ca3af', marginTop: 4 }}>{a.label}</div>
                </button>
              ))}
            </div>

            <div style={ls}>Observações</div>
            <textarea placeholder="Como foi o dia?..." value={day.notes} onChange={e => setNotes(e.target.value)} rows={3}
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#e5e7eb', fontSize: 13, resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />

            <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>📋 Regras</div>
              <div style={{ fontSize: 11, color: '#d4a017', lineHeight: 1.8 }}>
                Surf em jejum • Jantar 1ª hora pós-treino • Máx 1 Coca Zero/dia • 2 livres/semana • Energético só manhã • Água 3L+700ml/treino • Não pule o core!
              </div>
            </div>
          </div>
        )}

        {tab === 'evolucao' && (
          <DashboardEvolucao supabaseClient={null} userId={null} />
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', paddingBottom: 28, background: 'linear-gradient(transparent, rgba(10,10,15,0.95) 30%)', zIndex: 20 }}>
        <button onClick={() => generatePDF(day, dateFull(date))}
          style={{ width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          📄 Gerar PDF do Diário
        </button>
      </div>
    </div>
  );
}
