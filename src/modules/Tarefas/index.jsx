import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfogpofhrbzjwgsbxyuv.supabase.co',
  'sb_publishable_U9oYnGamRl_nVOmseQUn_A_SN3peIWq'
);

function haptic(s = 'light') { if (window.navigator?.vibrate) window.navigator.vibrate(s === 'light' ? 10 : 20); }

const PRIORITIES = {
  none:   { label: '—',     color: '#4b5563', bg: 'transparent' },
  low:    { label: 'Baixa', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  medium: { label: 'Média', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high:   { label: 'Alta',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const CATEGORIES = ['Pessoal','Trabalho','Saúde','Finanças','Estudos','Outro'];

// ─── Sheet de detalhes da tarefa ──────────────────────────────────────────
function TaskDetailSheet({ task, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({ ...task });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto', background: '#111118', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 16px' }} />

        {/* Título editável */}
        <input value={form.title} onChange={e => set('title', e.target.value)}
          style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#f9fafb', fontSize: 16, fontWeight: 600, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

        {/* Notas */}
        <textarea placeholder="Adicionar nota..." value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
          style={{ width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.6, marginBottom: 16, boxSizing: 'border-box' }} />

        {/* Prioridade */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Prioridade</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(PRIORITIES).filter(([k]) => k !== 'none').map(([k, p]) => (
              <button key={k} onClick={() => set('priority', form.priority === k ? 'none' : k)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${form.priority === k ? p.color : 'rgba(255,255,255,0.06)'}`, background: form.priority === k ? p.bg : 'transparent', color: form.priority === k ? p.color : '#4b5563', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categoria */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Categoria</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => set('category', form.category === c ? '' : c)}
                style={{ padding: '5px 12px', borderRadius: 16, border: `1px solid ${form.category === c ? '#10b981' : 'rgba(255,255,255,0.06)'}`, background: form.category === c ? 'rgba(16,185,129,0.1)' : 'transparent', color: form.category === c ? '#10b981' : '#6b7280', fontSize: 12, cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Data limite</div>
          <input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)}
            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#e5e7eb', fontSize: 13, outline: 'none' }} />
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { haptic('medium'); onDelete(task.id); }}
            style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 15, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { haptic('medium'); onSave(form); }}
            style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Nota ────────────────────────────────────────────────────────
function NoteModal({ note, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(note || { title: '', content: '' });
  const isEdit = !!note?.id;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto', background: '#111118', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 16px' }} />
        <input placeholder="Título (opcional)" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#f9fafb', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
        <textarea placeholder="Escreva sua nota..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10}
          style={{ width: '100%', padding: '0', background: 'transparent', border: 'none', color: '#e5e7eb', fontSize: 14, resize: 'none', outline: 'none', lineHeight: 1.7, marginBottom: 20, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {isEdit && <button onClick={() => { haptic('medium'); onDelete(note.id); }} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 15, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>}
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9ca3af', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (form.content.trim()) { haptic('medium'); onSave(form); } }}
            style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: form.content.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', color: form.content.trim() ? '#fff' : '#4b5563', fontSize: 13, fontWeight: 700, cursor: form.content.trim() ? 'pointer' : 'default' }}>
            {isEdit ? 'Salvar' : 'Criar nota'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function Tarefas({ onBack }) {
  const [tasks, setTasks]         = useState([]);
  const [notes, setNotes]         = useState([]);
  const [tab, setTab]             = useState('tarefas');
  const [filter, setFilter]       = useState('pending');
  const [detailTask, setDetailTask] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [input, setInput]         = useState('');
  const inputRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: t }, { data: n }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('notes').select('*').order('created_at', { ascending: false }),
    ]);
    setTasks(t || []);
    setNotes(n || []);
    setLoading(false);
  }

  // Criar tarefa rápida ao pressionar Enter
  async function quickCreate(e) {
    if (e.key !== 'Enter' || !input.trim()) return;
    haptic('medium');
    await supabase.from('tasks').insert({ title: input.trim(), status: 'pending', priority: 'none' });
    setInput('');
    loadData();
  }

  async function updateTask(form) {
    await supabase.from('tasks').update({ ...form, updated_at: new Date() }).eq('id', form.id);
    setDetailTask(null);
    loadData();
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id);
    setDetailTask(null);
    loadData();
  }

  async function toggleTask(id, status) {
    haptic('medium');
    await supabase.from('tasks').update({ status: status === 'done' ? 'pending' : 'done' }).eq('id', id);
    loadData();
  }

  async function saveNote(form) {
    if (form.id) await supabase.from('notes').update({ ...form, updated_at: new Date() }).eq('id', form.id);
    else await supabase.from('notes').insert(form);
    setNoteModal(null);
    loadData();
  }

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id);
    setNoteModal(null);
    loadData();
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'done')    return t.status === 'done';
    return true;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" }}>

      {detailTask && <TaskDetailSheet task={detailTask} onSave={updateTask} onClose={() => setDetailTask(null)} onDelete={deleteTask} />}
      {noteModal !== null && <NoteModal note={noteModal === 'new' ? null : noteModal} onSave={saveNote} onClose={() => setNoteModal(null)} onDelete={deleteNote} />}

      {/* Header */}
      <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 20, cursor: 'pointer', padding: '0 4px 0 0' }}>←</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />)}
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f9fafb' }}>cubo<span style={{ color: '#10b981' }}>.</span></span>
          </div>
          {tab === 'notas' && (
            <button onClick={() => setNoteModal('new')}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {[{ id: 'tarefas', l: '✅ Tarefas', badge: pendingCount }, { id: 'notas', l: '📝 Notas' }].map(t => (
            <button key={t.id} onClick={() => { haptic('light'); setTab(t.id); }}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === t.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#10b981' : '#6b7280', border: tab === t.id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {t.l}
              {t.badge > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: '#10b981', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Entrada rápida — só na aba tarefas */}
        {tab === 'tarefas' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
            <span style={{ fontSize: 16, color: '#4b5563' }}>+</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={quickCreate}
              placeholder="O que precisa fazer? (Enter para criar)"
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#f9fafb', fontSize: 14, outline: 'none', caretColor: '#10b981' }}
            />
            {input.trim() && (
              <button onClick={() => quickCreate({ key: 'Enter' })}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↵</button>
            )}
          </div>
        )}

        {/* Filtros */}
        {tab === 'tarefas' && (
          <div style={{ display: 'flex', gap: 6, paddingBottom: 14 }}>
            {[{ id: 'pending', l: 'Pendentes' }, { id: 'done', l: 'Concluídas' }, { id: 'all', l: 'Todas' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding: '5px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f.id ? '#10b981' : '#6b7280', transition: 'all 0.15s' }}>
                {f.l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '0 20px 100px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>Carregando...</div>}

        {/* Lista de tarefas */}
        {!loading && tab === 'tarefas' && (
          <div>
            {filteredTasks.length === 0 && (
              <div style={{ textAlign: 'center', color: '#4b5563', paddingTop: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{filter === 'done' ? '🎉' : '✅'}</div>
                <div style={{ fontSize: 14 }}>{filter === 'done' ? 'Nenhuma tarefa concluída' : 'Tudo limpo por aqui!'}</div>
                {filter === 'pending' && <div style={{ fontSize: 12, marginTop: 6, color: '#4b5563' }}>Digite acima e pressione Enter</div>}
              </div>
            )}
            {filteredTasks.map(task => {
              const p = PRIORITIES[task.priority || 'none'];
              const isDone = task.status === 'done';
              const isOverdue = task.due_date && !isDone && task.due_date < today;
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Check */}
                  <button onClick={() => toggleTask(task.id, task.status)}
                    style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${isDone ? '#10b981' : p.color !== '#4b5563' ? p.color : 'rgba(255,255,255,0.15)'}`, background: isDone ? '#10b981' : 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {isDone ? '✓' : ''}
                  </button>
                  {/* Conteúdo */}
                  <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={() => { haptic('light'); setDetailTask(task); }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: isDone ? '#4b5563' : '#f9fafb', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </div>
                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                      {task.priority && task.priority !== 'none' && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: p.color }}>{p.label}</span>
                      )}
                      {task.category && <span style={{ fontSize: 10, color: '#6b7280' }}>{task.category}</span>}
                      {task.due_date && (
                        <span style={{ fontSize: 10, color: isOverdue ? '#ef4444' : '#6b7280' }}>
                          {isOverdue ? '⚠️ ' : '📅 '}
                          {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {task.notes && <span style={{ fontSize: 10, color: '#4b5563' }}>📝</span>}
                    </div>
                  </div>
                  {/* Seta */}
                  <span style={{ fontSize: 14, color: '#2a2a3a', flexShrink: 0 }}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Lista de notas */}
        {!loading && tab === 'notas' && (
          <div>
            {notes.length === 0 && (
              <div style={{ textAlign: 'center', color: '#4b5563', paddingTop: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
                <div style={{ fontSize: 14 }}>Nenhuma nota ainda</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {notes.map(note => (
                <div key={note.id} onClick={() => { haptic('light'); setNoteModal(note); }}
                  style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', minHeight: 90 }}>
                  {note.title && <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>{note.title}</div>}
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{note.content.slice(0, 90)}{note.content.length > 90 ? '...' : ''}</div>
                  <div style={{ fontSize: 10, color: '#2a2a3a', marginTop: 8 }}>{new Date(note.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
