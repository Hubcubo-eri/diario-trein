import { useState, useEffect, useRef } from 'react';
import {
  PROGRAMS, ACTIVE_PROGRAM_ID, LEGACY_WORKOUT_MAP,
  MEALS, SUPPLEMENTS, ACTIVITIES, TOTAL_MEALS, emptyDay,
} from '../../data';
import { loadAllData, saveDay as saveDayDB, exportAllData } from '../../storage';
import { generatePDF } from '../../pdf';
import { DashboardEvolucao } from '../../DashboardEvolucao';

function dk(d) { return d.toISOString().slice(0, 10); }
function datePretty(d) { return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }); }
function dateFull(d) { return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }

function resolveWorkout(day) {
  if (day.program && PROGRAMS[day.program]) {
    const prog = PROGRAMS[day.program];
    const treino = prog.treinos[day.wk] || prog.treinos['treinoA'];
    return { program: PROGRAMS[day.program], treino };
  }
  const map = LEGACY_WORKOUT_MAP[day.wk] || LEGACY_WORKOUT_MAP['treino1'];
  return {
    program: PROGRAMS[map.program],
    treino: PROGRAMS[map.program].treinos[map.treino],
  };
}

// Haptic feedback leve
function haptic(style = 'light') {
  if (window.navigator?.vibrate) {
    window.navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40);
  }
}

// Pega último peso registrado para um exercício no histórico
function getLastWeight(allData, exId, currentKey) {
  const keys = Object.keys(allData).sort().reverse();
  for (const k of keys) {
    if (k === currentKey) continue;
    const w = allData[k]?.ex?.[exId]?.w;
    if (w) return w;
  }
  return null;
}

const APP_PIN = '0811';
const AUTH_KEY = 'cubo-diario-auth';
const VISIBLE_PROGRAMS_KEY = 'cubo-visible-programs-v2';

// ─── PIN ──────────────────────────────────────────────────────────────────
function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    haptic('light');
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (next === APP_PIN) { localStorage.setItem(AUTH_KEY, 'true'); onSuccess(); }
      else { setError(true); setShake(true); haptic('heavy'); setTimeout(() => { setPin(''); setShake(false); }, 600); }
    }
  };
  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(false); };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 16 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} />)}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>cubo<span style={{ color: '#10b981' }}>.</span></div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 32 }}>Digite o PIN para acessar</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12, animation: shake ? 'shake 0.4s' : 'none' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: i < pin.length ? (error ? '#ef4444' : '#10b981') : 'transparent', border: `2px solid ${error ? '#ef4444' : i < pin.length ? '#10b981' : '#4b5563'}`, transition: 'all 0.15s' }} />
        ))}
      </div>
      {error && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>PIN incorreto</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20, maxWidth: 260 }}>
        {[1,2,3,4,5,6,7,8,9,null,0,'⌫'].map((d, i) => (
          d === null ? <div key={i} /> :
          <button key={i} onClick={() => d === '⌫' ? handleDelete() : handleDigit(String(d))}
            style={{ width: 68, height: 68, borderRadius: '50%', border: 'none', background: d === '⌫' ? 'transparent' : 'rgba(255,255,255,0.06)', color: d === '⌫' ? '#6b7280' : '#e5e7eb', fontSize: d === '⌫' ? 22 : 24, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
            {d}
          </button>
        ))}
      </div>
      <style>{`@keyframes shake { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-8px) } 40%,80% { transform: translateX(8px) } }`}</style>
    </div>
  );
}

function AppGate() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  if (!authed) return <PinScreen onSuccess={() => setAuthed(true)} />;
  return <BemEstar />;
}

// ─── Modal de seleção de treino ───────────────────────────────────────────
function WorkoutPickerModal({ onConfirm }) {
  const [selected, setSelected] = useState(null);
  const prog = PROGRAMS[ACTIVE_PROGRAM_ID];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#111118', borderRadius: '24px 24px 0 0', padding: '28px 24px 48px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 28px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: '#10b981' }} />)}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>cubo<span style={{ color: '#10b981' }}>.</span></span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>Qual treino hoje? 💪</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{prog.label} — selecione para começar</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {Object.entries(prog.treinos).map(([tid, treino]) => {
            const isSelected = selected === tid;
            const totalEx = treino.sections.reduce((a, s) => a + s.exercises.length, 0);
            const sections = treino.sections.map(s => s.name).join(' · ');
            return (
              <button key={tid} onClick={() => { haptic('light'); setSelected(tid); }}
                style={{ padding: '18px 20px', borderRadius: 16, border: `2px solid ${isSelected ? '#10b981' : 'rgba(255,255,255,0.08)'}`, background: isSelected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isSelected ? '#10b981' : '#f9fafb' }}>{tid === 'treinoA' ? 'Treino A' : 'Treino B'}</div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSelected ? '#10b981' : '#4b5563'}`, background: isSelected ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{totalEx} exercícios · {sections}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => { if (selected) { haptic('medium'); onConfirm(ACTIVE_PROGRAM_ID, selected); } }}
          disabled={!selected}
          style={{ width: '100%', padding: '16px 0', background: selected ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 14, color: selected ? '#fff' : '#4b5563', fontSize: 15, fontWeight: 700, cursor: selected ? 'pointer' : 'default', boxShadow: selected ? '0 8px 30px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.2s' }}>
          Começar treino →
        </button>
      </div>
    </div>
  );
}

// ─── Modal de Configurações ───────────────────────────────────────────────
function SettingsModal({ onClose, visiblePrograms, setVisiblePrograms }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#111118', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>⚙️ Configurações</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>Programas visíveis no seletor de treino</div>
        {Object.entries(PROGRAMS).map(([pid, prog]) => {
          const isVisible = visiblePrograms.includes(pid);
          const isActive = prog.status === 'active';
          return (
            <div key={pid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>{prog.label}</div>
                <div style={{ fontSize: 11, color: isActive ? '#10b981' : '#6b7280', marginTop: 2 }}>{isActive ? '● Ativo' : '○ Arquivado'}</div>
              </div>
              <button onClick={() => { if (isActive) return; haptic('light'); setVisiblePrograms(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]); }}
                style={{ width: 48, height: 28, borderRadius: 14, border: 'none', cursor: isActive ? 'default' : 'pointer', background: isVisible ? '#10b981' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', opacity: isActive ? 0.5 : 1 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, transition: 'left 0.2s', left: isVisible ? 24 : 4 }} />
              </button>
            </div>
          );
        })}
        <button onClick={onClose}
          style={{ width: '100%', marginTop: 20, padding: '14px 0', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Fechar
        </button>
      </div>
    </div>
  );
}

// ─── Timer de descanso ────────────────────────────────────────────────────
function RestTimer({ onDismiss }) {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) { haptic('heavy'); onDismiss(); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, running]);

  useEffect(() => {
    if (seconds === 10) haptic('medium');
  }, [seconds]);

  const pct = (seconds / 60) * 100;
  const r = 36;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 150, background: '#1a1a24', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)', minWidth: 240 }}>
      <svg width={88} height={88} style={{ flexShrink: 0 }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle cx={44} cy={44} r={r} fill="none" stroke={seconds <= 10 ? '#f59e0b' : '#10b981'} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px', transition: 'stroke-dashoffset 1s linear' }} />
        <text x={44} y={50} textAnchor="middle" fill={seconds <= 10 ? '#f59e0b' : '#10b981'} fontSize={22} fontWeight={700} fontFamily="DM Sans">{seconds}</text>
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>Descanso</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>{seconds <= 10 ? '⚡ Quase lá!' : 'Próxima série em breve'}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { haptic('light'); setRunning(r => !r); }}
            style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            {running ? '⏸ Pausar' : '▶ Retomar'}
          </button>
          <button onClick={() => { haptic('light'); onDismiss(); }}
            style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            Pular ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de Exercício com Séries ─────────────────────────────────────────
function ExerciseCard({ e, exData, updateEx, cs, allData, currentKey }) {
  const [expanded, setExpanded] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const numSets = parseInt(e.sets) || 0;
  const series = exData.series || Array.from({ length: numSets }, () => ({ done: false, reps: 0 }));
  const allDone = series.every(s => s.done);
  const doneSets = series.filter(s => s.done).length;
  const lastWeight = e.hw ? getLastWeight(allData, e.id, currentKey) : null;

  const updateSerie = (idx, field, value) => {
    const newSeries = series.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    const allSeriesDone = newSeries.every(s => s.done);
    updateEx(e.id, 'series', newSeries);
    updateEx(e.id, 'done', allSeriesDone);

    // Se marcou série como feita, inicia timer de descanso (exceto última)
    if (field === 'done' && value === true) {
      haptic('medium');
      const doneCount = newSeries.filter(s => s.done).length;
      if (doneCount < numSets) setShowTimer(true);
      // Animação de conclusão total
      if (allSeriesDone || doneCount === numSets) {
        haptic('heavy');
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 1200);
      }
    }
  };

  return (
    <>
      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}
      <div style={{
        ...cs,
        background: allDone ? 'rgba(16,185,129,0.06)' : cs.background,
        border: allDone ? '1px solid rgba(16,185,129,0.2)' : cs.border,
        transform: justCompleted ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.3s ease, background 0.3s ease',
      }}>
        {/* Linha principal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => { haptic('light'); setExpanded(v => !v); }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: allDone ? '#10b981' : '#e5e7eb', textDecoration: allDone ? 'line-through' : 'none', opacity: allDone ? 0.8 : 1 }}>{e.name}</div>
              {e.paired && <span style={{ fontSize: 13 }}>🔗</span>}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span>{e.sets}×{e.reps}</span>
              <span style={{ color: doneSets > 0 ? '#10b981' : '#4b5563' }}>• {doneSets}/{numSets} séries</span>
              {lastWeight && <span style={{ color: '#6366f1' }}>• última: {lastWeight}kg</span>}
              {e.obs && <span style={{ color: '#9ca3af' }}>· {e.obs}</span>}
            </div>
          </div>
          <span style={{ fontSize: 16, color: '#4b5563', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 8 }}>▾</span>
        </div>

        {/* Conteúdo expandido */}
        {expanded && (
          <div style={{ marginTop: 14 }}>
            {e.hw && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Peso hoje:</span>
                <input type="number" placeholder={lastWeight ? `última: ${lastWeight}kg` : 'kg'} value={exData.w || ''}
                  onChange={ev => updateEx(e.id, 'w', ev.target.value)} onClick={ev => ev.stopPropagation()}
                  style={{ width: 90, padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 14, outline: 'none' }} />
                <span style={{ fontSize: 11, color: '#4b5563' }}>kg</span>
                {lastWeight && <span style={{ fontSize: 10, color: '#6366f1', marginLeft: 4 }}>ant.: {lastWeight}kg</span>}
              </div>
            )}

            {/* Séries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {series.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: s.done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: 12, border: `1px solid ${s.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s' }}>
                  <button onClick={() => updateSerie(idx, 'done', !s.done)}
                    style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: s.done ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.08)', color: s.done ? '#fff' : '#6b7280', fontSize: s.done ? 14 : 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: s.done ? '0 2px 8px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {s.done ? '✓' : idx + 1}
                  </button>
                  <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>Série {idx + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    <button onClick={() => { haptic('light'); updateSerie(idx, 'reps', Math.max(0, (s.reps || 0) - 1)); }}
                      style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 18, fontWeight: 700, color: s.done ? '#10b981' : '#e5e7eb', minWidth: 28, textAlign: 'center' }}>{s.reps || 0}</span>
                    <button onClick={() => { haptic('light'); updateSerie(idx, 'reps', (s.reps || 0) + 1); }}
                      style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Exercício conjugado */}
            {e.paired && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12 }}>🔗</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: exData.pairedDone ? '#10b981' : '#d1d5db', textDecoration: exData.pairedDone ? 'line-through' : 'none' }}>{e.paired.name}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, paddingLeft: 20 }}>{e.sets}×{e.paired.reps} • sem descanso</div>
                  </div>
                  <button onClick={() => { haptic('medium'); updateEx(e.id, 'pairedDone', !exData.pairedDone); }}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: exData.pairedDone ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(245,158,11,0.08)', color: exData.pairedDone ? '#fff' : '#f59e0b', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {exData.pairedDone ? '✓' : '○'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function BemEstar({ onBack }) {
  const [date, setDate]       = useState(new Date());
  const [allData, setAllData] = useState({});
  const [tab, setTab]         = useState('treino');
  const [expMeal, setExpMeal] = useState(null);
  const [showMsg, setShowMsg] = useState(true);
  const [view, setView]       = useState('today');
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [visiblePrograms, setVisiblePrograms] = useState(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_PROGRAMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const activeIds = Object.keys(PROGRAMS).filter(pid => PROGRAMS[pid].status === 'active');
        return [...new Set([...activeIds, ...parsed.filter(pid => PROGRAMS[pid]?.status !== 'active')])];
      }
      return Object.keys(PROGRAMS).filter(pid => PROGRAMS[pid].status === 'active');
    } catch { return Object.keys(PROGRAMS).filter(pid => PROGRAMS[pid].status === 'active'); }
  });
  const skipSave = useRef(true);
  const touchStartX = useRef(null);

  useEffect(() => {
    localStorage.setItem(VISIBLE_PROGRAMS_KEY, JSON.stringify(visiblePrograms));
  }, [visiblePrograms]);

  const key = dk(date);
  const day = allData[key] || emptyDay();
  const { treino: workout } = resolveWorkout(day);

  const isNewDay = !allData[key];
  const isToday = dk(new Date()) === key;
  const isRestDay = !!day.restDay;
  const showWorkoutPicker = isNewDay && isToday && tab === 'treino' && !isRestDay;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadAllData();
      setAllData(data);
      setLoading(false);
      setTimeout(() => { skipSave.current = false; }, 300);
    })();
  }, []);

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

  const setDay = (fn) => setAllData(prev => {
    const current = prev[key] || emptyDay();
    const updated = typeof fn === 'function' ? fn(current) : fn;
    return { ...prev, [key]: updated };
  });

  const updateEx  = (id, f, v) => setDay(d => ({ ...d, ex: { ...d.ex, [id]: { ...d.ex[id], [f]: v } } }));
  const toggleMc  = (id)       => setDay(d => ({ ...d, mc: { ...d.mc, [id]: !d.mc[id] } }));
  const toggleSp  = (id)       => setDay(d => ({ ...d, sp: { ...d.sp, [id]: !d.sp[id] } }));
  const toggleAct = (id)       => setDay(d => ({ ...d, act: { ...d.act, [id]: !d.act[id] } }));
  const toggleRestDay = ()     => setDay(d => ({ ...d, restDay: !d.restDay }));
  const setWater  = (n)        => setDay(d => ({ ...d, water: n }));
  const setCal    = (f, v)     => setDay(d => ({ ...d, cal: { ...d.cal, [f]: v } }));
  const setSub    = (id, v)    => setDay(d => ({ ...d, sub: { ...d.sub, [id]: v } }));
  const setNotes  = (v)        => setDay(d => ({ ...d, notes: v }));

  const confirmWorkout = (programId, treinoId) => {
    haptic('medium');
    setDay(d => ({ ...d, program: programId, wk: treinoId, workoutConfirmed: true }));
  };

  const isLegacy = !day.program && (day.wk === 'treino1' || day.wk === 'treino2');
  const currentProgramId = day.program ? day.program : isLegacy ? 'mes1' : ACTIVE_PROGRAM_ID;
  const currentProgram = PROGRAMS[currentProgramId] || PROGRAMS[ACTIVE_PROGRAM_ID];
  const isArchived = currentProgram.status === 'archived';
  const workoutConfirmed = (day.workoutConfirmed !== false && (!!day.workoutConfirmed || isLegacy || !!day.program));

  const programsToShow = Object.entries(PROGRAMS).filter(([pid, prog]) =>
    prog.status === 'active' || visiblePrograms.includes(pid)
  );

  const tEx = workout.sections.reduce((a, s) => a + s.exercises.length, 0);
  const dEx = workout.sections.reduce((a, s) => a + s.exercises.filter(e => day.ex[e.id]?.done).length, 0);
  const dM  = Object.keys(day.mc).filter(k => day.mc[k]).length;
  const dS  = Object.keys(day.sp).filter(k => day.sp[k]).length;

  // Swipe entre dias
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) { // swipe left → próximo dia
        const d = new Date(date); d.setDate(d.getDate() + 1);
        if (d <= new Date()) { haptic('light'); setDate(d); }
      } else { // swipe right → dia anterior
        const d = new Date(date); d.setDate(d.getDate() - 1);
        haptic('light'); setDate(d);
      }
    }
    touchStartX.current = null;
  };

  // Swipe entre abas
  const tabs = ['treino', 'comida', 'dia', 'evolucao'];
  const tabTouchStart = useRef(null);
  const handleTabSwipeStart = (e) => { tabTouchStart.current = e.touches[0].clientX; };
  const handleTabSwipeEnd = (e) => {
    if (tabTouchStart.current === null) return;
    const diff = tabTouchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      const idx = tabs.indexOf(tab);
      if (diff > 0 && idx < tabs.length - 1) { haptic('light'); setTab(tabs[idx + 1]); }
      else if (diff < 0 && idx > 0) { haptic('light'); setTab(tabs[idx - 1]); }
    }
    tabTouchStart.current = null;
  };

  const cs = { background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' };
  const ls = { fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: '#10b981', animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <div style={{ color: '#10b981', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Carregando...</div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </div>
  );

  const statusBadge = status && (
    <div style={{ position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 100, padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: status === 'saved' ? 'rgba(16,185,129,0.9)' : status === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.15)', color: '#fff' }}>
      {status === 'saving' ? '☁️ Salvando...' : status === 'saved' ? '☁️ ✓ Salvo' : '✗ Erro ao salvar'}
    </div>
  );

  // ── HISTORY ───────────────────────────────────────────────────────────────
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
          const { program: prog, treino: w } = resolveWorkout(d);
          const te = w.sections.reduce((a, s) => a + s.exercises.length, 0);
          const de = w.sections.reduce((a, s) => a + s.exercises.filter(e => (d.ex || {})[e.id]?.done).length, 0);
          const dm = Object.keys(d.mc || {}).filter(x => d.mc[x]).length;
          const ds = Object.keys(d.sp || {}).filter(x => d.sp[x]).length;
          const acts = ACTIVITIES.filter(a => (d.act || {})[a.id]);
          const c = d.cal || {}; const ct = parseInt(c.t) || ((parseInt(c.a) || 0) + (parseInt(c.b) || 0));
          const progLabel = prog.label || '';
          const treinoLabel = d.wk === 'treinoB' ? 'Treino B' : d.wk === 'treino2' ? 'Treino 2 (Mês 1)' : d.wk === 'treino1' ? 'Treino 1 (Mês 1)' : 'Treino A';
          return (
            <div key={k} style={{ ...cs, marginBottom: 10, cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => { setDate(new Date(k + 'T12:00:00')); setView('today'); }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = cs.background}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb', textTransform: 'capitalize' }}>{datePretty(dt)}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{progLabel} · {treinoLabel}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); generatePDF(d, dateFull(dt)); }}
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📄</button>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: de === te ? '#10b981' : '#9ca3af' }}>💪 {de}/{te}</span>
                <span style={{ fontSize: 11, color: dm === TOTAL_MEALS ? '#10b981' : '#9ca3af' }}>🥗 {dm}/{TOTAL_MEALS}</span>
                <span style={{ fontSize: 11, color: ds === SUPPLEMENTS.length ? '#10b981' : '#9ca3af' }}>💊 {ds}/{SUPPLEMENTS.length}</span>
                <span style={{ fontSize: 11, color: '#0ea5e9' }}>💧 {d.water || 0}/8</span>
                {ct > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>🔥 {ct}</span>}
              </div>
              {acts.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {acts.map(a => <span key={a.id} style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 10 }}>{a.icon}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div style={{ position: 'fixed', top: -120, right: -120, width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      {statusBadge}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} visiblePrograms={visiblePrograms} setVisiblePrograms={setVisiblePrograms} />}
      {showWorkoutPicker && <WorkoutPickerModal onConfirm={confirmWorkout} />}

      {/* ── Header ── */}
      <div style={{ padding: '20px 20px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo cubo. + botão voltar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 20, cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />)}
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f9fafb', letterSpacing: -0.5 }}>
              cubo<span style={{ color: '#10b981' }}>.</span>
            </span>
          </div>
          {/* Ações */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', width: 38, height: 38, borderRadius: 10, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
            <button onClick={() => setView('history')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', width: 38, height: 38, borderRadius: 10, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📊</button>
            <button onClick={() => generatePDF(day, dateFull(date))} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', width: 38, height: 38, borderRadius: 10, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</button>
          </div>
        </div>

        {/* Data */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); haptic('light'); setDate(d); }}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', width: 36, height: 36, borderRadius: 10, fontSize: 16, cursor: 'pointer' }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{dateFull(date)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', marginTop: 2 }}>Foco no Bucho! 🔥</div>
          </div>
          <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); if (d <= new Date()) { haptic('light'); setDate(d); } }}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: dk(new Date()) === key ? '#2a2a2a' : '#9ca3af', width: 36, height: 36, borderRadius: 10, fontSize: 16, cursor: dk(new Date()) === key ? 'default' : 'pointer' }}>›</button>
        </div>

        {/* Cards de progresso */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Treino',  v: `${dEx}/${tEx}`,               p: tEx ? (dEx/tEx)*100 : 0 },
            { l: 'Dieta',   v: `${dM}/${TOTAL_MEALS}`,        p: TOTAL_MEALS ? (dM/TOTAL_MEALS)*100 : 0 },
            { l: 'Suplem.', v: `${dS}/${SUPPLEMENTS.length}`, p: (dS/SUPPLEMENTS.length)*100 },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.p === 100 ? '#10b981' : '#f9fafb', lineHeight: 1 }}>{s.v}</div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.p}%`, background: s.p === 100 ? '#10b981' : '#10b981aa', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recado */}
      {showMsg && (
        <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 11, color: '#6ee7b7', lineHeight: 1.5, flex: 1 }}>
            <strong style={{ color: '#10b981' }}>Recado:</strong> Surf em jejum. Jantar 1ª hora pós-treino. 2 livres/semana. Não pule o core! 💪
          </div>
          <button onClick={() => setShowMsg(false)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16, padding: 4, marginLeft: 8 }}>×</button>
        </div>
      )}

      {/* Tabs com swipe */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 20px', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(16px)' }}
        onTouchStart={handleTabSwipeStart} onTouchEnd={handleTabSwipeEnd}>
        {[{ id: 'treino', l: 'Treino', i: '💪' }, { id: 'comida', l: 'Dieta', i: '🥗' }, { id: 'dia', l: 'Dia', i: '📋' }, { id: 'evolucao', l: 'Evolução', i: '📊' }].map(t => (
          <button key={t.id} onClick={() => { haptic('light'); setTab(t.id); }}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tab === t.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#10b981' : '#6b7280', border: tab === t.id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent', transition: 'all 0.15s' }}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* ══ TAB TREINO ══ */}
        {tab === 'treino' && (
          <div>
            {/* Banner dia de descanso */}
            {isRestDay && (
              <div style={{ marginBottom: 20, padding: '20px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: 14, border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🛌</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>Dia de Descanso</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Recuperação é parte do treino. 💪</div>
              </div>
            )}

            {workoutConfirmed && programsToShow.length > 1 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Programa</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {programsToShow.map(([pid, prog]) => (
                    <button key={pid}
                      onClick={() => { haptic('light'); setDay(d => ({ ...d, program: pid, wk: PROGRAMS[pid].treinos[day.wk] ? day.wk : 'treinoA' })); }}
                      style={{ flex: 1, padding: '8px 6px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: currentProgramId === pid ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.04)', color: currentProgramId === pid ? '#fff' : '#9ca3af' }}>
                      {prog.label}
                      {prog.status === 'archived' && <span style={{ display: 'block', fontSize: 9, fontWeight: 400, opacity: 0.7 }}>arquivado</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isArchived && (
              <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10, fontSize: 11, color: '#fbbf24' }}>
                📦 Programa arquivado — apenas consulta.
              </div>
            )}

            {/* Badge treino confirmado / seletor */}
            {workoutConfirmed ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 14, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                      {day.wk === 'treinoA' ? 'Treino A' : day.wk === 'treinoB' ? 'Treino B' : day.wk === 'treino1' ? 'Treino 1' : 'Treino 2'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{currentProgram.label} · {dEx}/{tEx} exercícios</div>
                  </div>
                  {isToday && (
                    <button onClick={() => { haptic('light'); setDay(d => ({ ...d, workoutConfirmed: false })); }}
                      style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', padding: '5px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>
                      trocar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {Object.keys(currentProgram.treinos).map(tid => (
                  <button key={tid}
                    onClick={() => { haptic('light'); setDay(d => ({ ...d, program: ACTIVE_PROGRAM_ID, wk: tid, workoutConfirmed: true })); }}
                    style={{ flex: 1, padding: '12px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: day.wk === tid ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.04)', color: day.wk === tid ? '#fff' : '#9ca3af' }}>
                    {tid === 'treinoA' ? 'Treino A' : tid === 'treinoB' ? 'Treino B' : tid === 'treino1' ? 'Treino 1' : 'Treino 2'}
                  </button>
                ))}
              </div>
            )}

            {/* Barra de progresso do treino */}
            {workoutConfirmed && tEx > 0 && (
              <div style={{ marginBottom: 20, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>Progresso do treino</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: dEx === tEx ? '#10b981' : '#9ca3af' }}>{Math.round((dEx/tEx)*100)}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(dEx/tEx)*100}%`, background: dEx === tEx ? '#10b981' : 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            {workout.sections.map(sec => (
              <div key={sec.name} style={{ marginBottom: 24 }}>
                <div style={ls}>{sec.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sec.exercises.map(e => (
                    <ExerciseCard key={e.id} e={e} exData={day.ex[e.id] || {}} updateEx={updateEx} cs={cs} allData={allData} currentKey={key} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB DIETA ══ */}
        {tab === 'comida' && (
          <div>
            <div style={ls}>Hidratação</div>
            <div style={{ ...cs, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <button key={i} onClick={() => { haptic('light'); setWater(i < day.water ? i : i + 1); }}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < day.water ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'rgba(255,255,255,0.06)', color: i < day.water ? '#fff' : '#4b5563', boxShadow: i < day.water ? '0 2px 8px rgba(14,165,233,0.3)' : 'none', transition: 'all 0.15s' }}>💧</button>
                ))}
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: day.water >= 8 ? '#0ea5e9' : '#6b7280' }}>{day.water}/8</span>
            </div>
            {Object.entries(MEALS).map(([mk, meal]) => (
              <div key={mk} style={{ marginBottom: 10 }}>
                <button onClick={() => setExpMeal(expMeal === mk ? null : mk)}
                  style={{ width: '100%', textAlign: 'left', background: day.sp && day.sp[mk] ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${day.sp && day.sp[mk] ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: expMeal === mk ? '12px 12px 0 0' : 12, padding: '12px 14px', cursor: 'pointer', color: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, opacity: day.sp && day.sp[mk] ? 0.6 : 1 }}>{meal.icon}</span>
                    <div style={{ opacity: day.sp && day.sp[mk] ? 0.6 : 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, textDecoration: day.sp && day.sp[mk] ? 'line-through' : 'none' }}>{meal.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{meal.items.filter(it => day.mc[it.id]).length}/{meal.items.length}{day.sp && day.sp[mk] ? '*' : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {meal.items.every(it => day.mc[it.id]) && !day.sp?.[mk] && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>✓</span>}
                    {day.sp && day.sp[mk] && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>✕</span>}
                    <button onClick={e => { e.stopPropagation(); toggleSp(mk); }}
                      style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: day.sp && day.sp[mk] ? 'rgba(239,68,68,0.2)' : 'transparent', color: day.sp && day.sp[mk] ? '#ef4444' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 4 }}>
                      {day.sp && day.sp[mk] ? '↺' : '+'}
                    </button>
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
                          <button onClick={() => { haptic('light'); toggleMc(item.id); }}
                            style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: day.mc[item.id] ? '#10b981' : 'rgba(255,255,255,0.06)', color: day.mc[item.id] ? '#fff' : '#4b5563', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            {day.mc[item.id] ? '✓' : '○'}
                          </button>
                        </div>
                        {item.subs && (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ fontSize: 10, color: '#6b7280' }}>Subst.: {item.subs}</div>
                            <input type="text" placeholder="Usou qual?" value={day.sub[item.id] || ''} onChange={e => setSub(item.id, e.target.value)}
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
                  <button onClick={() => { haptic('light'); toggleSp(s.id); }}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: day.sp[s.id] ? '#10b981' : 'rgba(255,255,255,0.06)', color: day.sp[s.id] ? '#fff' : '#4b5563', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {day.sp[s.id] ? '✓' : '○'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB DIA ══ */}
        {tab === 'dia' && (
          <div>
            <div style={ls}>Calorias — Garmin ⌚</div>
            <div style={{ ...cs, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[{ k: 'a', l: 'Ativas', c: '#f59e0b', i: '🔥' }, { k: 'b', l: 'Basal', c: '#8b5cf6', i: '💤' }, { k: 't', l: 'Total', c: '#10b981', i: '⚡' }].map(c => (
                  <div key={c.k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>{c.i} {c.l}</div>
                    <input type="number" placeholder="kcal" value={day.cal[c.k] || ''} onChange={e => setCal(c.k, e.target.value)}
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
            {/* Botão dia de descanso */}
            <button onClick={() => { haptic('medium'); toggleRestDay(); }}
              style={{ width: '100%', marginBottom: 12, padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', border: isRestDay ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)', background: isRestDay ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>🛌</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isRestDay ? '#a5b4fc' : '#e5e7eb' }}>Dia de Descanso</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Sem treino hoje</div>
                </div>
              </div>
              <div style={{ width: 48, height: 28, borderRadius: 14, background: isRestDay ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, left: isRestDay ? 24 : 4, transition: 'left 0.2s' }} />
              </div>
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
              {ACTIVITIES.map(a => (
                <button key={a.id} onClick={() => { haptic('light'); toggleAct(a.id); }}
                  style={{ padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center', border: day.act[a.id] ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.05)', background: day.act[a.id] ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 22 }}>{a.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: day.act[a.id] ? '#10b981' : '#9ca3af', marginTop: 4 }}>{a.label}</div>
                </button>
              ))}
            </div>
            <div style={ls}>Observações</div>
            <textarea placeholder="Como foi o dia?..." value={day.notes} onChange={e => setNotes(e.target.value)} rows={3}
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#e5e7eb', fontSize: 13, resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
            <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>📋 Regras</div>
              <div style={{ fontSize: 11, color: '#d4a017', lineHeight: 1.8 }}>Surf em jejum • Jantar 1ª hora pós-treino • Máx 1 Coca Zero/dia • 2 livres/semana • Energético só manhã • Água 3L+700ml/treino • Não pule o core!</div>
            </div>
          </div>
        )}

        {/* ══ TAB EVOLUÇÃO ══ */}
        {tab === 'evolucao' && (
          <DashboardEvolucao supabaseClient={null} userId={null} allData={allData} />
        )}
      </div>
    </div>
  );
}
