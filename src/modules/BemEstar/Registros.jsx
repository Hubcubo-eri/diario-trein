import { useState, useRef } from 'react';
import {
  haptic, uid, nowHHMM, num,
  waterLog, waterTotal, waterGoal,
  FOOD_MEALS, guessMeal, foodTotals, freeMealsThisWeek, foodSuggestions,
  INTENSITY, EXTRA_ACTIVITIES, activityMeta, dayActivities, compressImage,
} from './helpers';

// ─── Estilos compartilhados ───────────────────────────────────────────────
export const cs = { background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' };
export const ls = { fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 };
const inp = { width: '100%', padding: '11px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e5e7eb', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl = { fontSize: 11, color: '#6b7280', marginBottom: 5, display: 'block' };
const chip = (on, color = '#10b981') => ({ padding: '7px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? color + '66' : 'rgba(255,255,255,0.08)'}`, background: on ? color + '22' : 'rgba(255,255,255,0.03)', color: on ? color : '#9ca3af', whiteSpace: 'nowrap' });
const primaryBtn = (enabled = true) => ({ width: '100%', padding: '14px 0', background: enabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: enabled ? '#fff' : '#4b5563', fontSize: 15, fontWeight: 700, cursor: enabled ? 'pointer' : 'default' });
const iconBtn = { width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#6b7280', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const addBtn = { width: '100%', padding: '12px 0', borderRadius: 12, border: '1px dashed rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.05)', color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

// ─── Bottom sheet ─────────────────────────────────────────────────────────
export function Sheet({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: '#111118', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', border: '1px solid rgba(255,255,255,0.08)', boxSizing: 'border-box' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>{title}</div>
          <button onClick={onClose} style={{ ...iconBtn, fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ═══ HIDRATAÇÃO ═══════════════════════════════════════════════════════════
export function Hidratacao({ day, config, onAdd, onRemove }) {
  const [custom, setCustom] = useState('');
  const [showLog, setShowLog] = useState(false);
  const total = waterTotal(day);
  const goal = waterGoal(day, config);
  const pct = Math.min(100, (total / goal) * 100);
  const log = waterLog(day);
  const done = total >= goal;

  const add = (ml) => { if (ml > 0) { haptic('light'); onAdd(ml); } };

  return (
    <div style={{ ...cs, marginBottom: 20, background: done ? 'rgba(14,165,233,0.07)' : cs.background, border: done ? '1px solid rgba(14,165,233,0.25)' : cs.border }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: done ? '#0ea5e9' : '#f9fafb', lineHeight: 1 }}>
            {(total / 1000).toFixed(2).replace('.', ',')}<span style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}> / {(goal / 1000).toFixed(1).replace('.', ',')} L</span>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            {done ? '✓ Meta batida! 💧' : `Faltam ${Math.max(0, goal - total)} ml`}
            {goal > config.waterGoal && <span style={{ color: '#0ea5e9' }}> · +{config.waterPerWorkout}ml (dia de treino)</span>}
          </div>
        </div>
        <span style={{ fontSize: 28 }}>💧</span>
      </div>
      <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #38bdf8, #0284c7)', borderRadius: 5, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.cupSizes.length}, 1fr)`, gap: 6, marginBottom: 10 }}>
        {config.cupSizes.map(ml => (
          <button key={ml} onClick={() => add(ml)}
            style={{ padding: '10px 0', borderRadius: 10, border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.1)', color: '#38bdf8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            +{ml}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input type="number" inputMode="numeric" placeholder="Outro valor (ml)" value={custom} onChange={e => setCustom(e.target.value)}
          style={{ ...inp, padding: '8px 10px', fontSize: 14 }} />
        <button onClick={() => { add(Math.round(num(custom))); setCustom(''); }}
          style={{ padding: '0 14px', borderRadius: 10, border: 'none', background: 'rgba(14,165,233,0.2)', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}>+</button>
        {log.length > 0 && (
          <button onClick={() => setShowLog(v => !v)}
            style={{ padding: '0 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {showLog ? 'Ocultar' : `${log.length} registros`}
          </button>
        )}
      </div>
      {showLog && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...log].reverse().map(w => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{w.legacy ? 'Registro antigo (copos)' : w.t}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{w.ml} ml</span>
                <button onClick={() => { haptic('light'); onRemove(w.id); }} style={{ ...iconBtn, width: 24, height: 24, fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ O QUE COMI ═══════════════════════════════════════════════════════════
function FoodForm({ initial, allData, onSave, onDelete, onClose }) {
  const [f, setF] = useState(() => initial || { meal: guessMeal(), desc: '', qty: '', kcal: '', prot: '', livre: false, t: nowHHMM() });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const suggestions = foodSuggestions(allData);
  const q = f.desc.trim().toLowerCase();
  const matches = q.length >= 2 && !initial ? suggestions.filter(s => s.desc.toLowerCase().includes(q) && s.desc.toLowerCase() !== q).slice(0, 4) : [];

  return (
    <Sheet title={initial ? 'Editar refeição' : 'O que você comeu?'} onClose={onClose}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {FOOD_MEALS.map(m => (
          <button key={m.id} onClick={() => set('meal', m.id)} style={chip(f.meal === m.id)}>{m.icon} {m.label}</button>
        ))}
      </div>
      <label style={lbl}>Descrição</label>
      <textarea autoFocus value={f.desc} onChange={e => set('desc', e.target.value)} rows={2}
        placeholder="Ex.: 2 ovos mexidos, 1 tapioca com queijo, café sem açúcar"
        style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
      {matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {matches.map(m => (
            <button key={m.id} onClick={() => setF(p => ({ ...p, desc: m.desc, qty: m.qty || '', kcal: m.kcal || '', prot: m.prot || '' }))}
              style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontSize: 12, cursor: 'pointer' }}>
              ↺ {m.desc}{m.kcal ? ` · ${m.kcal} kcal` : ''}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
        <div><label style={lbl}>Qtd.</label><input value={f.qty} onChange={e => set('qty', e.target.value)} placeholder="200g" style={inp} /></div>
        <div><label style={lbl}>Kcal</label><input type="number" inputMode="numeric" value={f.kcal} onChange={e => set('kcal', e.target.value)} placeholder="—" style={inp} /></div>
        <div><label style={lbl}>Prot. (g)</label><input type="number" inputMode="decimal" value={f.prot} onChange={e => set('prot', e.target.value)} placeholder="—" style={inp} /></div>
        <div><label style={lbl}>Hora</label><input type="time" value={f.t} onChange={e => set('t', e.target.value)} style={{ ...inp, padding: '11px 4px' }} /></div>
      </div>
      <button onClick={() => set('livre', !f.livre)}
        style={{ ...chip(f.livre, '#f59e0b'), marginTop: 14, width: '100%', padding: '11px 0', borderRadius: 12 }}>
        {f.livre ? '🍔 Refeição livre ✓' : '🍔 Marcar como refeição livre'}
      </button>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {onDelete && <button onClick={onDelete} style={{ padding: '0 18px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>Excluir</button>}
        <button disabled={!f.desc.trim()} onClick={() => { haptic('medium'); onSave({ ...f, desc: f.desc.trim(), id: f.id || uid() }); }} style={primaryBtn(!!f.desc.trim())}>
          {initial ? 'Salvar' : 'Registrar'}
        </button>
      </div>
    </Sheet>
  );
}

export function DiarioAlimentar({ day, allData, dateKey, onSave, onRemove }) {
  const [editing, setEditing] = useState(null); // null | 'new' | entry
  const food = day.food || [];
  const totals = foodTotals(day);
  const livres = freeMealsThisWeek(allData, dateKey);
  const grouped = FOOD_MEALS.map(m => ({ ...m, items: food.filter(f => f.meal === m.id).sort((a, b) => (a.t || '').localeCompare(b.t || '')) }))
    .filter(g => g.items.length);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ ...cs, flex: 1, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>🔥 Kcal registradas</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{totals.kcal ? Math.round(totals.kcal) : '—'}</div>
        </div>
        <div style={{ ...cs, flex: 1, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>🥩 Proteína</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>{totals.prot ? `${Math.round(totals.prot)}g` : '—'}</div>
        </div>
        <div style={{ ...cs, flex: 1, padding: '10px 12px', border: livres > 2 ? '1px solid rgba(239,68,68,0.3)' : cs.border }}>
          <div style={{ fontSize: 10, color: '#6b7280' }}>🍔 Livres/sem.</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: livres > 2 ? '#ef4444' : livres === 2 ? '#f59e0b' : '#10b981' }}>{livres}/2</div>
        </div>
      </div>

      {grouped.length === 0 && (
        <div style={{ ...cs, textAlign: 'center', color: '#6b7280', fontSize: 12, marginBottom: 10 }}>Nada registrado ainda. Anote tudo o que comer — inclusive o que fugir do plano.</div>
      )}

      {grouped.map(g => (
        <div key={g.id} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>{g.icon} {g.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {g.items.map(f => (
              <button key={f.id} onClick={() => setEditing(f)}
                style={{ ...cs, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', border: f.livre ? '1px solid rgba(245,158,11,0.3)' : cs.border, background: f.livre ? 'rgba(245,158,11,0.06)' : cs.background }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.4 }}>{f.desc}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {[f.t, f.qty, f.kcal && `${f.kcal} kcal`, f.prot && `${f.prot}g prot.`, f.livre && '🍔 livre'].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span style={{ color: '#4b5563', fontSize: 12 }}>✎</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button onClick={() => { haptic('light'); setEditing('new'); }} style={addBtn}>+ Registrar o que comi</button>

      {editing && (
        <FoodForm
          initial={editing === 'new' ? null : editing}
          allData={allData}
          onClose={() => setEditing(null)}
          onSave={entry => { onSave(entry); setEditing(null); }}
          onDelete={editing !== 'new' ? () => { onRemove(editing.id); setEditing(null); } : null}
        />
      )}
    </div>
  );
}

// ═══ SUPLEMENTOS ══════════════════════════════════════════════════════════
function SupplementEditor({ config, onSave, onClose }) {
  const [list, setList] = useState(() => config.supplements.map(s => ({ ...s })));
  const [n, setN] = useState({ name: '', qty: '', period: '' });
  const upd = (i, k, v) => setList(l => l.map((s, j) => j === i ? { ...s, [k]: v } : s));
  const move = (i, d) => setList(l => { const c = [...l]; const j = i + d; if (j < 0 || j >= c.length) return c; [c[i], c[j]] = [c[j], c[i]]; return c; });

  return (
    <Sheet title="💊 Meus suplementos" onClose={onClose}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Essa lista aparece todo dia para você marcar. Desativar um suplemento esconde dos próximos dias sem apagar o histórico.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {list.map((s, i) => (
          <div key={s.id} style={{ ...cs, padding: 10, opacity: s.off ? 0.5 : 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={s.name} onChange={e => upd(i, 'name', e.target.value)} style={{ ...inp, padding: '8px 10px', fontSize: 14 }} />
              <button onClick={() => move(i, -1)} style={iconBtn}>↑</button>
              <button onClick={() => move(i, 1)} style={iconBtn}>↓</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={s.qty} onChange={e => upd(i, 'qty', e.target.value)} placeholder="Dose" style={{ ...inp, padding: '8px 10px', fontSize: 14 }} />
              <input value={s.period} onChange={e => upd(i, 'period', e.target.value)} placeholder="Quando" style={{ ...inp, padding: '8px 10px', fontSize: 14 }} />
              <button onClick={() => upd(i, 'off', !s.off)} style={{ ...iconBtn, width: 'auto', padding: '0 10px', fontSize: 11, color: s.off ? '#10b981' : '#f59e0b' }}>{s.off ? 'Ativar' : 'Pausar'}</button>
              <button onClick={() => setList(l => l.filter((_, j) => j !== i))} style={{ ...iconBtn, color: '#ef4444' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...ls, marginBottom: 8 }}>Adicionar</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        <input value={n.name} onChange={e => setN({ ...n, name: e.target.value })} placeholder="Nome (ex.: Ômega 3)" style={inp} />
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={n.qty} onChange={e => setN({ ...n, qty: e.target.value })} placeholder="Dose (ex.: 2 cáps.)" style={inp} />
          <input value={n.period} onChange={e => setN({ ...n, period: e.target.value })} placeholder="Quando (ex.: almoço)" style={inp} />
        </div>
        <button disabled={!n.name.trim()} onClick={() => { setList(l => [...l, { id: 'sup_' + uid(), name: n.name.trim(), qty: n.qty.trim(), period: n.period.trim() }]); setN({ name: '', qty: '', period: '' }); }}
          style={{ ...addBtn, opacity: n.name.trim() ? 1 : 0.5 }}>+ Adicionar à lista</button>
      </div>
      <button onClick={() => { haptic('medium'); onSave(list.filter(s => s.name.trim())); }} style={primaryBtn()}>Salvar lista</button>
    </Sheet>
  );
}

export function Suplementos({ day, config, onToggle, onAddExtra, onRemoveExtra, onSaveList }) {
  const [editList, setEditList] = useState(false);
  const [extra, setExtra] = useState(null);
  // Mostra os ativos + os pausados que foram marcados nesse dia
  const list = config.supplements.filter(s => !s.off || day.sp?.[s.id]);
  const extras = day.supExtra || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
        <div style={{ ...ls, marginBottom: 0 }}>Suplementos</div>
        <button onClick={() => setEditList(true)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>✎ editar lista</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map(s => {
          const on = !!day.sp?.[s.id];
          return (
            <button key={s.id} onClick={() => { haptic('light'); onToggle(s.id); }}
              style={{ ...cs, cursor: 'pointer', textAlign: 'left', background: on ? 'rgba(16,185,129,0.06)' : cs.background, border: on ? '1px solid rgba(16,185,129,0.2)' : cs.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: on ? '#10b981' : '#e5e7eb' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{[s.qty, s.period].filter(Boolean).join(' • ')}{on && day.spT?.[s.id] ? <span style={{ color: '#10b981' }}> · tomou às {day.spT[s.id]}</span> : ''}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: on ? '#10b981' : 'rgba(255,255,255,0.06)', color: on ? '#fff' : '#4b5563', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on ? '✓' : '○'}</div>
            </button>
          );
        })}
        {extras.map(x => (
          <div key={x.id} style={{ ...cs, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>{x.name} <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 400 }}>avulso</span></div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{[x.qty, x.t].filter(Boolean).join(' • ')}</div>
            </div>
            <button onClick={() => onRemoveExtra(x.id)} style={iconBtn}>✕</button>
          </div>
        ))}
      </div>
      {extra ? (
        <div style={{ ...cs, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input autoFocus value={extra.name} onChange={e => setExtra({ ...extra, name: e.target.value })} placeholder="O que tomou? (ex.: Cafeína, Dipirona)" style={inp} />
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={extra.qty} onChange={e => setExtra({ ...extra, qty: e.target.value })} placeholder="Dose" style={inp} />
            <input type="time" value={extra.t} onChange={e => setExtra({ ...extra, t: e.target.value })} style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setExtra(null)} style={{ ...addBtn, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9ca3af' }}>Cancelar</button>
            <button disabled={!extra.name.trim()} onClick={() => { haptic('medium'); onAddExtra({ ...extra, name: extra.name.trim(), id: uid() }); setExtra(null); }} style={primaryBtn(!!extra.name.trim())}>Registrar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setExtra({ name: '', qty: '', t: nowHHMM() })} style={{ ...addBtn, marginTop: 8 }}>+ Tomei outro suplemento hoje</button>
      )}
      {editList && <SupplementEditor config={config} onClose={() => setEditList(false)} onSave={l => { onSaveList(l); setEditList(false); }} />}
    </div>
  );
}

// ═══ ATIVIDADES ═══════════════════════════════════════════════════════════
function ActivityForm({ initial, onSave, onDelete, onClose }) {
  const [a, setA] = useState(() => initial || { type: '', name: '', dur: '', dist: '', kcal: '', fc: '', intensity: 'moderada', notes: '', t: nowHHMM() });
  const set = (k, v) => setA(p => ({ ...p, [k]: v }));
  const meta = a.type ? activityMeta(a.type) : null;
  const valid = a.type && (a.type !== 'outra' || a.name.trim());

  return (
    <Sheet title={meta ? `${meta.icon} ${a.type === 'outra' && a.name ? a.name : meta.label}` : 'Registrar atividade'} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
        {EXTRA_ACTIVITIES.map(x => (
          <button key={x.id} onClick={() => { haptic('light'); set('type', x.id); }}
            style={{ padding: '8px 2px', borderRadius: 10, cursor: 'pointer', border: a.type === x.id ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.05)', background: a.type === x.id ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 20 }}>{x.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: a.type === x.id ? '#10b981' : '#9ca3af', marginTop: 2 }}>{x.label}</div>
          </button>
        ))}
      </div>
      {a.type === 'outra' && (
        <div style={{ marginBottom: 10 }}><label style={lbl}>Qual atividade?</label><input value={a.name} onChange={e => set('name', e.target.value)} placeholder="Ex.: Remo, Yoga, Trilha" style={inp} /></div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><label style={lbl}>⏱ Duração (min)</label><input type="number" inputMode="numeric" value={a.dur} onChange={e => set('dur', e.target.value)} placeholder="60" style={inp} /></div>
        <div><label style={lbl}>📍 Distância (km)</label><input type="number" inputMode="decimal" value={a.dist} onChange={e => set('dist', e.target.value)} placeholder="—" style={inp} /></div>
        <div><label style={lbl}>🔥 Kcal (Garmin)</label><input type="number" inputMode="numeric" value={a.kcal} onChange={e => set('kcal', e.target.value)} placeholder="—" style={inp} /></div>
        <div><label style={lbl}>❤️ FC média</label><input type="number" inputMode="numeric" value={a.fc} onChange={e => set('fc', e.target.value)} placeholder="bpm" style={inp} /></div>
      </div>
      <label style={{ ...lbl, marginTop: 12 }}>Intensidade</label>
      <div style={{ display: 'flex', gap: 6 }}>
        {INTENSITY.map(i => <button key={i.id} onClick={() => set('intensity', i.id)} style={{ ...chip(a.intensity === i.id, i.color), flex: 1 }}>{i.label}</button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8, marginTop: 12 }}>
        <div><label style={lbl}>Notas</label><input value={a.notes} onChange={e => set('notes', e.target.value)} placeholder="Ex.: mar flat, 2h de sessão" style={inp} /></div>
        <div><label style={lbl}>Hora</label><input type="time" value={a.t} onChange={e => set('t', e.target.value)} style={{ ...inp, padding: '11px 4px' }} /></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        {onDelete && <button onClick={onDelete} style={{ padding: '0 18px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>Excluir</button>}
        <button disabled={!valid} onClick={() => { haptic('medium'); const { legacy: _l, ...rest } = a; onSave({ ...rest, id: a.legacy || !a.id ? uid() : a.id, name: a.name?.trim() || '' }); }} style={primaryBtn(!!valid)}>Salvar</button>
      </div>
    </Sheet>
  );
}

export function Atividades({ day, onSave, onRemove }) {
  const [editing, setEditing] = useState(null);
  const list = dayActivities(day);
  const totalMin = list.reduce((s, a) => s + num(a.dur), 0);
  const totalKcal = list.reduce((s, a) => s + num(a.kcal), 0);

  return (
    <div style={{ marginBottom: 24 }}>
      {list.length > 0 && (totalMin > 0 || totalKcal > 0) && (
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
          {totalMin > 0 && <>⏱ <b style={{ color: '#e5e7eb' }}>{totalMin} min</b> </>}
          {totalKcal > 0 && <> · 🔥 <b style={{ color: '#f59e0b' }}>{totalKcal} kcal</b></>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {list.map(a => {
          const m = activityMeta(a.type);
          const int = INTENSITY.find(i => i.id === a.intensity);
          const details = [a.t, a.dur && `${a.dur} min`, a.dist && `${a.dist} km`, a.kcal && `${a.kcal} kcal`, a.fc && `${a.fc} bpm`].filter(Boolean).join(' · ');
          return (
            <button key={a.id} onClick={() => setEditing(a)}
              style={{ ...cs, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ fontSize: 24 }}>{m.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                  {a.type === 'outra' && a.name ? a.name : m.label}
                  {int && <span style={{ fontSize: 10, color: int.color, marginLeft: 8, fontWeight: 600 }}>● {int.label}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{a.legacy ? 'Toque para adicionar detalhes' : details || 'Sem detalhes'}</div>
                {a.notes && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{a.notes}</div>}
              </div>
              <span style={{ color: '#4b5563', fontSize: 12 }}>✎</span>
            </button>
          );
        })}
      </div>
      <button onClick={() => { haptic('light'); setEditing('new'); }} style={addBtn}>+ Registrar atividade</button>
      {editing && (
        <ActivityForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={entry => { onSave(entry, editing !== 'new' ? editing : null); setEditing(null); }}
          onDelete={editing !== 'new' ? () => { onRemove(editing); setEditing(null); } : null}
        />
      )}
    </div>
  );
}

// ═══ TREINO DO DIA (registro livre + fotos) ═══════════════════════════════
export function TreinoLivre({ day, onChange }) {
  const tl = day.treinoLivre || {};
  const [open, setOpen] = useState(!!(tl.texto || tl.fotos?.length));
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState(null);
  const fileRef = useRef(null);
  const fotos = tl.fotos || [];

  const addPhotos = async (files) => {
    setBusy(true);
    try {
      const imgs = [];
      for (const f of [...files].slice(0, 4 - fotos.length)) imgs.push(await compressImage(f));
      onChange({ fotos: [...fotos, ...imgs] });
      haptic('medium');
    } catch { alert('Não consegui carregar essa imagem.'); }
    setBusy(false);
  };

  if (!open) {
    return (
      <button onClick={() => { haptic('light'); setOpen(true); }} style={{ ...addBtn, marginBottom: 24 }}>
        📝 Registrar treino do dia (texto, print do relógio ou foto)
      </button>
    );
  }

  return (
    <div style={{ ...cs, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb' }}>📝 Treino do dia</div>
        {!tl.texto && !fotos.length && <button onClick={() => setOpen(false)} style={iconBtn}>×</button>}
      </div>
      <textarea value={tl.texto || ''} onChange={e => onChange({ texto: e.target.value })} rows={4}
        placeholder={'Descreva ou cole o treino que fez.\nEx.: Treino extra com o personal — 4x10 leg press 120kg, 3x12 cadeira abdutora...'}
        style={{ ...inp, fontSize: 14, resize: 'vertical', lineHeight: 1.5 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <div><label style={lbl}>⏱ Duração total (min)</label><input type="number" inputMode="numeric" value={tl.dur || ''} onChange={e => onChange({ dur: e.target.value })} style={inp} /></div>
        <div><label style={lbl}>🔥 Kcal do treino</label><input type="number" inputMode="numeric" value={tl.kcal || ''} onChange={e => onChange({ kcal: e.target.value })} style={inp} /></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {fotos.map((src, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={src} alt="" onClick={() => setViewer(src)} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
            <button onClick={() => onChange({ fotos: fotos.filter((_, j) => j !== i) })}
              style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', fontSize: 11, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        {fotos.length < 4 && (
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            style={{ width: 72, height: 72, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', color: '#9ca3af', fontSize: 11, cursor: 'pointer' }}>
            {busy ? '...' : <>📷<br />Foto/print</>}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files?.length) addPhotos(e.target.files); e.target.value = ''; }} />
      </div>
      {viewer && (
        <div onClick={() => setViewer(null)} style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={viewer} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
