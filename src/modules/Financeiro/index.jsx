import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfogpofhrbzjwgsbxyuv.supabase.co',
  'sb_publishable_U9oYnGamRl_nVOmseQUn_A_SN3peIWq'
);

function haptic(s = 'light') { if (window.navigator?.vibrate) window.navigator.vibrate(s === 'light' ? 10 : 20); }
function fmt(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function dk(d) { return d.toISOString().slice(0, 10); }
function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

const ACCOUNT_TYPES = { checking: '🏦 Corrente', savings: '💰 Poupança', wallet: '👛 Carteira', investment: '📈 Investimento' };
const ACCOUNT_ICONS = ['🏦','💰','👛','📈','💳','🏠'];
const CAT_ICONS_EXPENSE = ['🍔','🏠','🚗','📱','🎓','🏄','🏋️','💊','👕','✈️','🎮','📦'];
const CAT_ICONS_INCOME  = ['💼','💻','🎯','📊','🏢','💡','🎁','📝'];
const COLORS = ['#10b981','#6366f1','#f59e0b','#ef4444','#0ea5e9','#ec4899','#8b5cf6','#f97316'];

const cs = { background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' };
const ls = { fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 };
const inputStyle = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

// ─── Modal genérico bottom sheet ─────────────────────────────────────────
function Sheet({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#111118', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        {title && <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 20 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

function SaveBtn({ label, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: disabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #10b981, #059669)', color: disabled ? '#4b5563' : '#fff', fontSize: 14, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', boxShadow: disabled ? 'none' : '0 4px 20px rgba(16,185,129,0.3)', marginTop: 8 }}>
      {label}
    </button>
  );
}

// ─── Modal Conta ──────────────────────────────────────────────────────────
function AccountModal({ account, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(account || { name: '', type: 'checking', balance: '', color: '#10b981', icon: '🏦' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Sheet title={account ? 'Editar conta' : 'Nova conta'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Nome da conta" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Tipo</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(ACCOUNT_TYPES).map(([k, v]) => (
              <button key={k} onClick={() => set('type', k)}
                style={{ padding: '8px', borderRadius: 10, border: `1px solid ${form.type === k ? '#10b981' : 'rgba(255,255,255,0.08)'}`, background: form.type === k ? 'rgba(16,185,129,0.1)' : 'transparent', color: form.type === k ? '#10b981' : '#9ca3af', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <input type="number" placeholder="Saldo inicial (R$)" value={form.balance} onChange={e => set('balance', e.target.value)} style={inputStyle} />
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Ícone</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ACCOUNT_ICONS.map(ic => (
              <button key={ic} onClick={() => set('icon', ic)}
                style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${form.icon === ic ? '#10b981' : 'transparent'}`, background: 'rgba(255,255,255,0.05)', fontSize: 18, cursor: 'pointer' }}>{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Cor</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`, background: c, cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {account && <button onClick={() => onDelete(account.id)} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>🗑</button>}
          <SaveBtn label={account ? 'Salvar' : 'Criar conta'} disabled={!form.name.trim()} onClick={() => { haptic('medium'); onSave(form); }} />
        </div>
      </div>
    </Sheet>
  );
}

// ─── Modal Categoria ──────────────────────────────────────────────────────
function CategoryModal({ cat, type, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(cat || { name: '', type: type || 'expense', icon: '📦', color: '#6b7280', budget: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const icons = form.type === 'expense' ? CAT_ICONS_EXPENSE : CAT_ICONS_INCOME;
  return (
    <Sheet title={cat ? 'Editar categoria' : 'Nova categoria'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{v:'expense',l:'Despesa'},{v:'income',l:'Receita'}].map(t => (
            <button key={t.v} onClick={() => set('type', t.v)}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid ${form.type === t.v ? (t.v==='expense'?'#ef4444':'#10b981') : 'rgba(255,255,255,0.08)'}`, background: form.type === t.v ? (t.v==='expense'?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)') : 'transparent', color: form.type === t.v ? (t.v==='expense'?'#ef4444':'#10b981') : '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t.l}
            </button>
          ))}
        </div>
        <input placeholder="Nome da categoria" value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
        <input type="number" placeholder={form.type === 'expense' ? 'Meta de gasto (R$)' : 'Meta de recebimento (R$)'} value={form.budget} onChange={e => set('budget', e.target.value)} style={inputStyle} />
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Ícone</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {icons.map(ic => (
              <button key={ic} onClick={() => set('icon', ic)}
                style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${form.icon === ic ? '#10b981' : 'transparent'}`, background: 'rgba(255,255,255,0.05)', fontSize: 18, cursor: 'pointer' }}>{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Cor</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`, background: c, cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {cat && <button onClick={() => onDelete(cat.id)} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>🗑</button>}
          <SaveBtn label={cat ? 'Salvar' : 'Criar categoria'} disabled={!form.name.trim()} onClick={() => { haptic('medium'); onSave(form); }} />
        </div>
      </div>
    </Sheet>
  );
}

// ─── Modal Transação ──────────────────────────────────────────────────────
function TransactionModal({ tx, type, accounts, categories, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(tx || { description: '', amount: '', type: type || 'expense', category_id: '', account_id: accounts[0]?.id || '', date: dk(new Date()), status: 'done', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const filtCats = categories.filter(c => c.type === form.type);
  return (
    <Sheet title={tx ? 'Editar lançamento' : 'Novo lançamento'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{v:'expense',l:'Despesa',c:'#ef4444'},{v:'income',l:'Receita',c:'#10b981'}].map(t => (
            <button key={t.v} onClick={() => set('type', t.v)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${form.type===t.v ? t.c : 'rgba(255,255,255,0.08)'}`, background: form.type===t.v ? `${t.c}18` : 'transparent', color: form.type===t.v ? t.c : '#9ca3af', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t.l}
            </button>
          ))}
        </div>
        <input placeholder="Descrição" value={form.description} onChange={e => set('description', e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => set('amount', e.target.value)} style={{ ...inputStyle, fontSize: 20, fontWeight: 700, color: form.type === 'income' ? '#10b981' : '#ef4444' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Data</div>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Status</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{v:'done',l:'Realizado'},{v:'planned',l:'Previsto'}].map(s => (
                <button key={s.v} onClick={() => set('status', s.v)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${form.status===s.v ? '#10b981' : 'rgba(255,255,255,0.08)'}`, background: form.status===s.v ? 'rgba(16,185,129,0.1)' : 'transparent', color: form.status===s.v ? '#10b981' : '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Categoria</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {filtCats.map(c => (
              <button key={c.id} onClick={() => set('category_id', c.id)}
                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${form.category_id===c.id ? c.color : 'rgba(255,255,255,0.08)'}`, background: form.category_id===c.id ? `${c.color}20` : 'transparent', color: form.category_id===c.id ? c.color : '#9ca3af', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Conta</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {accounts.map(a => (
              <button key={a.id} onClick={() => set('account_id', a.id)}
                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${form.account_id===a.id ? a.color : 'rgba(255,255,255,0.08)'}`, background: form.account_id===a.id ? `${a.color}20` : 'transparent', color: form.account_id===a.id ? a.color : '#9ca3af', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {a.icon} {a.name}
              </button>
            ))}
          </div>
        </div>
        <textarea placeholder="Observações..." value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {tx && <button onClick={() => onDelete(tx.id)} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>🗑</button>}
          <SaveBtn label={tx ? 'Salvar' : 'Lançar'} disabled={!form.description.trim() || !form.amount} onClick={() => { haptic('medium'); onSave(form); }} />
        </div>
      </div>
    </Sheet>
  );
}

// ─── Modal Recorrência ────────────────────────────────────────────────────
function RecurrenceModal({ rec, accounts, categories, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(rec || { description: '', amount: '', type: 'expense', category_id: '', account_id: accounts[0]?.id || '', day_of_month: 1, active: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const filtCats = categories.filter(c => c.type === form.type);
  return (
    <Sheet title={rec ? 'Editar recorrência' : 'Nova recorrência'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{v:'expense',l:'Despesa',c:'#ef4444'},{v:'income',l:'Receita',c:'#10b981'}].map(t => (
            <button key={t.v} onClick={() => set('type', t.v)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${form.type===t.v ? t.c : 'rgba(255,255,255,0.08)'}`, background: form.type===t.v ? `${t.c}18` : 'transparent', color: form.type===t.v ? t.c : '#9ca3af', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t.l}
            </button>
          ))}
        </div>
        <input placeholder="Descrição (ex: Aluguel, Salário)" value={form.description} onChange={e => set('description', e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => set('amount', e.target.value)} style={{ ...inputStyle, fontSize: 18, fontWeight: 700, color: form.type === 'income' ? '#10b981' : '#ef4444' }} />
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Dia do mês</div>
          <input type="number" min={1} max={31} value={form.day_of_month} onChange={e => set('day_of_month', parseInt(e.target.value))} style={{ ...inputStyle, width: 80 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Categoria</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {filtCats.map(c => (
              <button key={c.id} onClick={() => set('category_id', c.id)}
                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${form.category_id===c.id ? c.color : 'rgba(255,255,255,0.08)'}`, background: form.category_id===c.id ? `${c.color}20` : 'transparent', color: form.category_id===c.id ? c.color : '#9ca3af', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Conta</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {accounts.map(a => (
              <button key={a.id} onClick={() => set('account_id', a.id)}
                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${form.account_id===a.id ? a.color : 'rgba(255,255,255,0.08)'}`, background: form.account_id===a.id ? `${a.color}20` : 'transparent', color: form.account_id===a.id ? a.color : '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
                {a.icon} {a.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {rec && <button onClick={() => onDelete(rec.id)} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>🗑</button>}
          <SaveBtn label={rec ? 'Salvar' : 'Criar recorrência'} disabled={!form.description.trim() || !form.amount} onClick={() => { haptic('medium'); onSave(form); }} />
        </div>
      </div>
    </Sheet>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function Financeiro({ onBack }) {
  const [tab, setTab]           = useState('dashboard');
  const [loading, setLoading]   = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [recurrences, setRecurrences] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modal, setModal]       = useState(null); // { type, data? }
  const [txFilter, setTxFilter] = useState('all'); // all | income | expense

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [a, c, t, r] = await Promise.all([
      supabase.from('fin_accounts').select('*').order('created_at'),
      supabase.from('fin_categories').select('*').order('type').order('name'),
      supabase.from('fin_transactions').select('*').order('date', { ascending: false }),
      supabase.from('fin_recurrences').select('*').order('day_of_month'),
    ]);
    setAccounts(a.data || []);
    setCategories(c.data || []);
    setTransactions(t.data || []);
    setRecurrences(r.data || []);
    setLoading(false);
  }

  // ── CRUD helpers ──────────────────────────────────────────────────────
  async function saveAccount(form) {
    if (form.id) await supabase.from('fin_accounts').update(form).eq('id', form.id);
    else await supabase.from('fin_accounts').insert(form);
    setModal(null); loadAll();
  }
  async function deleteAccount(id) {
    await supabase.from('fin_accounts').delete().eq('id', id);
    setModal(null); loadAll();
  }
  async function saveCategory(form) {
    if (form.id) await supabase.from('fin_categories').update(form).eq('id', form.id);
    else await supabase.from('fin_categories').insert(form);
    setModal(null); loadAll();
  }
  async function deleteCategory(id) {
    await supabase.from('fin_categories').delete().eq('id', id);
    setModal(null); loadAll();
  }
  async function saveTransaction(form) {
    if (form.id) await supabase.from('fin_transactions').update(form).eq('id', form.id);
    else await supabase.from('fin_transactions').insert(form);
    setModal(null); loadAll();
  }
  async function deleteTransaction(id) {
    await supabase.from('fin_transactions').delete().eq('id', id);
    setModal(null); loadAll();
  }
  async function saveRecurrence(form) {
    if (form.id) await supabase.from('fin_recurrences').update(form).eq('id', form.id);
    else await supabase.from('fin_recurrences').insert(form);
    setModal(null); loadAll();
  }
  async function deleteRecurrence(id) {
    await supabase.from('fin_recurrences').delete().eq('id', id);
    setModal(null); loadAll();
  }
  async function toggleTxStatus(tx) {
    haptic('medium');
    await supabase.from('fin_transactions').update({ status: tx.status === 'done' ? 'planned' : 'done' }).eq('id', tx.id);
    loadAll();
  }

  // ── Cálculos do mês ───────────────────────────────────────────────────
  const mk = monthKey(currentMonth);
  const monthTx = transactions.filter(t => t.date?.slice(0,7) === mk);
  const realized = monthTx.filter(t => t.status === 'done');
  const realIncome  = realized.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0);
  const realExpense = realized.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0);
  const plannedIncome  = monthTx.filter(t => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0);
  const plannedExpense = monthTx.filter(t => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0);
  const totalBalance = accounts.reduce((a, acc) => a + Number(acc.balance), 0);
  const result = realIncome - realExpense;

  // Despesas por categoria no mês
  const expByCat = {};
  monthTx.filter(t => t.type === 'expense' && t.status === 'done').forEach(t => {
    expByCat[t.category_id] = (expByCat[t.category_id] || 0) + Number(t.amount);
  });

  // Saúde financeira: % comprometido com fixos
  const totalFixed = recurrences.filter(r => r.active && r.type === 'expense').reduce((a, r) => a + Number(r.amount), 0);
  const totalFixedIncome = recurrences.filter(r => r.active && r.type === 'income').reduce((a, r) => a + Number(r.amount), 0);
  const healthPct = totalFixedIncome > 0 ? Math.min(100, Math.round((totalFixed / totalFixedIncome) * 100)) : 0;

  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const filteredTx = txFilter === 'all' ? monthTx : monthTx.filter(t => t.type === txFilter);

  const getCat = (id) => categories.find(c => c.id === id);
  const getAcc = (id) => accounts.find(a => a.id === id);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: '#10b981', animation: 'pulse 1.5s infinite', animationDelay: `${i*0.15}s` }} />)}
      </div>
      <div style={{ color: '#10b981', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Carregando...</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Modais */}
      {modal?.type === 'account'    && <AccountModal    account={modal.data}    onSave={saveAccount}    onClose={() => setModal(null)} onDelete={deleteAccount} />}
      {modal?.type === 'category'   && <CategoryModal   cat={modal.data} type={modal.catType} onSave={saveCategory}   onClose={() => setModal(null)} onDelete={deleteCategory} />}
      {modal?.type === 'transaction' && <TransactionModal tx={modal.data} type={modal.txType} accounts={accounts} categories={categories} onSave={saveTransaction} onClose={() => setModal(null)} onDelete={deleteTransaction} />}
      {modal?.type === 'recurrence' && <RecurrenceModal  rec={modal.data}        accounts={accounts} categories={categories} onSave={saveRecurrence} onClose={() => setModal(null)} onDelete={deleteRecurrence} />}

      {/* Header */}
      <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 20, cursor: 'pointer', padding: '0 4px 0 0' }}>←</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />)}
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f9fafb' }}>cubo<span style={{ color: '#10b981' }}>.</span></span>
          </div>
          {/* Botão + contextual */}
          <button onClick={() => {
            haptic('light');
            if (tab === 'lancamentos') setModal({ type: 'transaction' });
            else if (tab === 'recorrencias') setModal({ type: 'recurrence' });
            else if (tab === 'contas') setModal({ type: 'account' });
            else if (tab === 'categorias') setModal({ type: 'category' });
            else setModal({ type: 'transaction' });
          }} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>+</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3, paddingBottom: 14, overflowX: 'auto' }}>
          {[
            { id: 'dashboard', l: '📊', full: 'Resumo' },
            { id: 'lancamentos', l: '💸', full: 'Lançamentos' },
            { id: 'recorrencias', l: '🔄', full: 'Fixos' },
            { id: 'contas', l: '🏦', full: 'Contas' },
            { id: 'categorias', l: '🏷️', full: 'Categorias' },
          ].map(t => (
            <button key={t.id} onClick={() => { haptic('light'); setTab(t.id); }}
              style={{ flexShrink: 0, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: tab === t.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#10b981' : '#6b7280', border: tab === t.id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent', whiteSpace: 'nowrap' }}>
              {t.l} {t.full}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>

        {/* ══ DASHBOARD ══ */}
        {tab === 'dashboard' && (
          <div>
            {/* Navegação de mês */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 }}>
              <button onClick={() => { haptic('light'); setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1)); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 16, cursor: 'pointer' }}>‹</button>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>{MONTHS_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
              <button onClick={() => { haptic('light'); setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1)); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 16, cursor: 'pointer' }}>›</button>
            </div>

            {/* Saldo total */}
            <div style={{ ...cs, marginBottom: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Saldo total nas contas</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: totalBalance >= 0 ? '#10b981' : '#ef4444' }}>{fmt(totalBalance)}</div>
            </div>

            {/* Resultado do mês */}
            <div style={{ ...cs, marginBottom: 12, textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Resultado do mês (realizado)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: result >= 0 ? '#10b981' : '#ef4444' }}>{fmt(result)}</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>{result >= 0 ? '✓ Saldo positivo' : '⚠️ Gastos acima da receita'}</div>
            </div>

            {/* Cards receita/despesa */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Receitas', real: realIncome, plan: plannedIncome, color: '#10b981', icon: '↑' },
                { label: 'Despesas', real: realExpense, plan: plannedExpense, color: '#ef4444', icon: '↓' },
              ].map(c => (
                <div key={c.label} style={{ ...cs, padding: '14px' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{c.icon} {c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{fmt(c.real)}</div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>prev. {fmt(c.plan)}</div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${c.plan > 0 ? Math.min(100, (c.real/c.plan)*100) : 0}%`, background: c.color, borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Saúde financeira */}
            <div style={{ ...cs, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb' }}>Saúde financeira</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: healthPct > 70 ? '#ef4444' : healthPct > 50 ? '#f59e0b' : '#10b981' }}>{healthPct}% comprometido</div>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Fixos sobre receita recorrente</div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${healthPct}%`, background: healthPct > 70 ? '#ef4444' : healthPct > 50 ? '#f59e0b' : '#10b981', borderRadius: 4, transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#4b5563' }}>
                <span>Fixos: {fmt(totalFixed)}</span>
                <span>Rec. fixas: {fmt(totalFixedIncome)}</span>
              </div>
            </div>

            {/* Despesas por categoria */}
            {Object.keys(expByCat).length > 0 && (
              <div style={{ ...cs, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Despesas por categoria</div>
                {Object.entries(expByCat).sort((a,b) => b[1]-a[1]).map(([catId, val]) => {
                  const cat = getCat(catId);
                  if (!cat) return null;
                  const budget = Number(cat.budget || 0);
                  const pct = budget > 0 ? Math.min(100, (val/budget)*100) : 0;
                  return (
                    <div key={catId} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#e5e7eb' }}>{cat.icon} {cat.name}</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: budget > 0 && val > budget ? '#ef4444' : '#f9fafb' }}>{fmt(val)}</span>
                          {budget > 0 && <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>/ {fmt(budget)}</span>}
                        </div>
                      </div>
                      {budget > 0 && (
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : cat.color || '#10b981', borderRadius: 2 }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contas */}
            {accounts.length > 0 && (
              <div style={{ ...cs }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Contas</div>
                {accounts.map(acc => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${acc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{acc.icon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{acc.name}</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>{ACCOUNT_TYPES[acc.type]}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: Number(acc.balance) >= 0 ? '#10b981' : '#ef4444' }}>{fmt(acc.balance)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ LANÇAMENTOS ══ */}
        {tab === 'lancamentos' && (
          <div>
            {/* Navegação de mês */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 4 }}>
              <button onClick={() => { haptic('light'); setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1)); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 16, cursor: 'pointer' }}>‹</button>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb' }}>{MONTHS_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
              <button onClick={() => { haptic('light'); setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1)); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 16, cursor: 'pointer' }}>›</button>
            </div>

            {/* Resumo rápido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ ...cs, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#6b7280' }}>↑ Receitas</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{fmt(realIncome)}</div>
                <div style={{ fontSize: 10, color: '#4b5563' }}>prev. {fmt(plannedIncome)}</div>
              </div>
              <div style={{ ...cs, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#6b7280' }}>↓ Despesas</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{fmt(realExpense)}</div>
                <div style={{ fontSize: 10, color: '#4b5563' }}>prev. {fmt(plannedExpense)}</div>
              </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[{id:'all',l:'Todos'},{id:'income',l:'Receitas'},{id:'expense',l:'Despesas'}].map(f => (
                <button key={f.id} onClick={() => setTxFilter(f.id)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: txFilter === f.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', color: txFilter === f.id ? '#10b981' : '#6b7280' }}>
                  {f.l}
                </button>
              ))}
            </div>

            {/* Botões rápidos */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setModal({ type: 'transaction', txType: 'income' })}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Receita</button>
              <button onClick={() => setModal({ type: 'transaction', txType: 'expense' })}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Despesa</button>
            </div>

            {filteredTx.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💸</div>
                <div>Nenhum lançamento neste mês</div>
              </div>
            )}

            {filteredTx.map(tx => {
              const cat = getCat(tx.category_id);
              const acc = getAcc(tx.account_id);
              return (
                <div key={tx.id} style={{ ...cs, marginBottom: 8, opacity: tx.status === 'planned' ? 0.7 : 1 }}
                  onClick={() => { haptic('light'); setModal({ type: 'transaction', data: tx }); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={e => { e.stopPropagation(); toggleTxStatus(tx); }}
                      style={{ width: 36, height: 36, borderRadius: 10, border: `2px solid ${tx.type === 'income' ? '#10b981' : '#ef4444'}`, background: tx.status === 'done' ? (tx.type === 'income' ? '#10b981' : '#ef4444') : 'transparent', color: '#fff', fontSize: 14, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tx.status === 'done' ? '✓' : (cat?.icon || (tx.type === 'income' ? '↑' : '↓'))}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span>{new Date(tx.date+'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                        {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                        {acc && <span>{acc.icon} {acc.name}</span>}
                        {tx.status === 'planned' && <span style={{ color: '#f59e0b' }}>previsto</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: tx.type === 'income' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ RECORRÊNCIAS ══ */}
        {tab === 'recorrencias' && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
              Lançamentos fixos mensais — salário, aluguel, assinaturas, etc.
            </div>
            {['income','expense'].map(type => {
              const recs = recurrences.filter(r => r.type === type);
              if (recs.length === 0) return null;
              const total = recs.filter(r => r.active).reduce((a, r) => a + Number(r.amount), 0);
              return (
                <div key={type} style={{ marginBottom: 24 }}>
                  <div style={{ ...ls, color: type === 'income' ? '#10b981' : '#ef4444' }}>
                    {type === 'income' ? '↑ Receitas fixas' : '↓ Despesas fixas'} — {fmt(total)}/mês
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recs.map(r => {
                      const cat = getCat(r.category_id);
                      const acc = getAcc(r.account_id);
                      return (
                        <div key={r.id} style={{ ...cs, opacity: r.active ? 1 : 0.5 }}
                          onClick={() => { haptic('light'); setModal({ type: 'recurrence', data: r }); }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${type === 'income' ? '#10b981' : '#ef4444'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                              {cat?.icon || '🔄'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb' }}>{r.description}</div>
                              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                                Todo dia {r.day_of_month} {cat && `· ${cat.name}`} {acc && `· ${acc.icon} ${acc.name}`}
                              </div>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: type === 'income' ? '#10b981' : '#ef4444' }}>
                              {fmt(r.amount)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {recurrences.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔄</div>
                <div>Nenhuma recorrência cadastrada</div>
              </div>
            )}
          </div>
        )}

        {/* ══ CONTAS ══ */}
        {tab === 'contas' && (
          <div style={{ marginTop: 4 }}>
            {accounts.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏦</div>
                <div>Nenhuma conta cadastrada</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ ...cs, cursor: 'pointer', borderLeft: `3px solid ${acc.color}` }}
                  onClick={() => { haptic('light'); setModal({ type: 'account', data: acc }); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${acc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{acc.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>{acc.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{ACCOUNT_TYPES[acc.type]}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: Number(acc.balance) >= 0 ? '#10b981' : '#ef4444' }}>{fmt(acc.balance)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Total: <span style={{ color: totalBalance >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{fmt(totalBalance)}</span></div>
            </div>
          </div>
        )}

        {/* ══ CATEGORIAS ══ */}
        {tab === 'categorias' && (
          <div style={{ marginTop: 4 }}>
            {['expense','income'].map(type => {
              const cats = categories.filter(c => c.type === type);
              return (
                <div key={type} style={{ marginBottom: 24 }}>
                  <div style={{ ...ls, color: type === 'income' ? '#10b981' : '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{type === 'income' ? '↑ Receitas' : '↓ Despesas'}</span>
                    <button onClick={() => setModal({ type: 'category', catType: type })}
                      style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>+ nova</button>
                  </div>
                  {cats.length === 0 && <div style={{ fontSize: 12, color: '#4b5563' }}>Nenhuma categoria</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cats.map(cat => (
                      <div key={cat.id} style={{ ...cs, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                        onClick={() => { haptic('light'); setModal({ type: 'category', data: cat }); }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cat.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb' }}>{cat.name}</div>
                          {cat.budget && <div style={{ fontSize: 11, color: '#6b7280' }}>Meta: {fmt(cat.budget)}</div>}
                        </div>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
