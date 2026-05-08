import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfogpofhrbzjwgsbxyuv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2dwb2ZocmJ6andnc2J4eXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI5MjUsImV4cCI6MjA2MDQ5ODkyNX0.MNDMeHvhCrBMTqRJDsgv9Mp2BDR14QhvHGQJQLQlbpY'
);

function haptic(s = 'light') { if (window.navigator?.vibrate) window.navigator.vibrate(s === 'light' ? 10 : 20); }

const PRIORITIES = {
  high:   { label: 'Alta',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  medium: { label: 'Média',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  low:    { label: 'Baixa',  color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const CATEGORIES = ['Pessoal', 'Trabalho', 'Saúde', 'Finanças', 'Estudos', 'Outro'];

function emptyTask() {
  return { title: '', notes: '', priority: 'medium', category: 'Pessoal', due_date: '', status: 'pending' };
}

// ─── Modal de Tarefa ──────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(task || emptyTask());
  const isEdit = !!task?.id;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#111118', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 20 }}>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</div>

        {/* Título */}
        <input placeholder="Título da tarefa" value={form.title} onChange={e => set('title', e.target.value)}
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f9fafb', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

        {/* Notas */}
        <textarea placeholder="Anotações..." value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3}
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e5e7eb', fontSize: 13, resize: 'vertical', outline: 'none', lineHeight: 1.6, marginBottom: 12, boxSizing: 'border-box' }} />

        {/* Prioridade */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Prioridade</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(PRIORITIES).map(([k, p]) => (
              <button key={k} onClick={() => set('priority', k)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${form.priority === k ? p.color : 'rgba(255,255,255,0.08)'}`, background: form.priority === k ? p.bg : 'transparent', color: form.priority === k ? p.color : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categoria */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Categoria</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => set('category', c)}
                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${form.category === c ? '#10b981' : 'rgba(255,255,255,0.08)'}`, background: form.category === c ? 'rgba(16,185,129,0.12)' : 'transparent', color: form.category === c ? '#10b981' : '#6b7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Data limite</div>
          <input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isEdit && (
            <button onClick={() => { haptic('medium'); onDelete(task.id); }}
              style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🗑</button>
          )}
          <button onClick={onClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={() => { if (form.title.trim()) { haptic('medium'); onSave(form); } }}
            style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: form.title.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', color: form.title.trim() ? '#fff' : '#4b5563', fontSize: 14, fontWeight: 700, cursor: form.title.trim() ? 'pointer' : 'default', boxShadow: form.title.trim() ? '0 4px 20px rgba(16,185,129,0.3)' : 'none' }}>
            {isEdit ? 'Salvar' : 'Criar tarefa'}
          </button>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#111118', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 20 }}>{isEdit ? 'Editar nota' : 'Nova nota'}</div>

        <input placeholder="Título (opcional)" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f9fafb', fontSize: 14, fontWeight: 600, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

        <textarea placeholder="Escreva sua nota..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8}
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e5e7eb', fontSize: 14, resize: 'vertical', outline: 'none', lineHeight: 1.7, marginBottom: 20, boxSizing: 'border-box' }} />

        <div style={{ display: 'flex', gap: 8 }}>
          {isEdit && (
            <button onClick={() => { haptic('medium'); onDelete(note.id); }}
              style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🗑</button>
          )}
          <button onClick={onClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (form.content.trim()) { haptic('medium'); onSave(form); } }}
            style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: form.content.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', color: form.content.trim() ? '#fff' : '#4b5563', fontSize: 14, fontWeight: 700, cursor: form.content.trim() ? 'pointer' : 'default' }}>
            {isEdit ? 'Salvar' : 'Criar nota'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function Tarefas({ onBack }) {
  const [tasks, setTasks]     = useState([]);
  const [notes, setNotes]     = useState([]);
  const [tab, setTab]         = useState('tarefas');
  const [filter, setFilter]   = useState('all');
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task obj
  const [noteModal, setNoteModal] = useState(null);
  const [loading, setLoading] = useState(true);

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

  async function saveTask(form) {
    if (form.id) {
      await supabase.from('tasks').update({ ...form, updated_at: new Date() }).eq('id', form.id);
    } else {
      await supabase.from('tasks').insert(form);
    }
    setTaskModal(null);
    loadData();
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id);
    setTaskModal(null);
    loadData();
  }

  async function toggleTask(id, status) {
    haptic('medium');
    await supabase.from('tasks').update({ status: status === 'done' ? 'pending' : 'done', updated_at: new Date() }).eq('id', id);
    loadData();
  }

  async function saveNote(form) {
    if (form.id) {
      await supabase.from('notes').update({ ...form, updated_at: new Date() }).eq('id', form.id);
    } else {
      await supabase.from('notes').insert(form);
    }
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
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  const cs = { background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" }}>
      {taskModal !== null && (
        <TaskModal task={taskModal === 'new' ? null : taskModal} onSave={saveTask} onClose={() => setTaskModal(null)} onDelete={deleteTask} />
      )}
      {noteModal !== null && (
        <NoteModal note={noteModal === 'new' ? null : noteModal} onSave={saveNote} onClose={() => setNoteModal(null)} onDelete={deleteNote} />
      )}

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />)}
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f9fafb' }}>cubo<span style={{ color: '#10b981' }}>.</span></span>
          </div>
          <button onClick={() => { haptic('light'); tab === 'tarefas' ? setTaskModal('new') : setNoteModal('new'); }}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>+</button>
        </div>

        {/* Título + stats */}
        <div style={{ marginTop: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f9fafb' }}>
            {tab === 'tarefas' ? 'Tarefas' : 'Notas'} {tab === 'tarefas' && pendingCount > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>{pendingCount}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {[{ id: 'tarefas', l: '✅ Tarefas' }, { id: 'notas', l: '📝 Notas' }].map(t => (
            <button key={t.id} onClick={() => { haptic('light'); setTab(t.id); }}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === t.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#10b981' : '#6b7280', border: tab === t.id ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent' }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Filtros de tarefas */}
        {tab === 'tarefas' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[{ id: 'all', l: 'Todas' }, { id: 'pending', l: 'Pendentes' }, { id: 'done', l: 'Concluídas' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === f.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f.id ? '#10b981' : '#6b7280' }}>
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
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div>{filter === 'done' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa pendente'}</div>
              </div>
            )}
            {filteredTasks.map(task => {
              const p = PRIORITIES[task.priority] || PRIORITIES.medium;
              const isDone = task.status === 'done';
              const isOverdue = task.due_date && !isDone && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} style={{ ...cs, marginBottom: 10, opacity: isDone ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button onClick={() => toggleTask(task.id, task.status)}
                      style={{ width: 26, height: 26, borderRadius: 8, border: `2px solid ${isDone ? '#10b981' : p.color}`, background: isDone ? '#10b981' : 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, transition: 'all 0.2s' }}>
                      {isDone ? '✓' : ''}
                    </button>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { haptic('light'); setTaskModal(task); }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: isDone ? '#6b7280' : '#f9fafb', textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</div>
                      {task.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, lineHeight: 1.4 }}>{task.notes.slice(0, 80)}{task.notes.length > 80 ? '...' : ''}</div>}
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: p.color, background: p.bg, padding: '2px 8px', borderRadius: 10 }}>{p.label}</span>
                        {task.category && <span style={{ fontSize: 10, color: '#6b7280', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>{task.category}</span>}
                        {task.due_date && <span style={{ fontSize: 10, color: isOverdue ? '#ef4444' : '#6b7280' }}>{isOverdue ? '⚠️ ' : '📅 '}{new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lista de notas */}
        {!loading && tab === 'notas' && (
          <div>
            {notes.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <div>Nenhuma nota ainda</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {notes.map(note => (
                <div key={note.id} onClick={() => { haptic('light'); setNoteModal(note); }}
                  style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', minHeight: 100 }}>
                  {note.title && <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb', marginBottom: 6 }}>{note.title}</div>}
                  <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{note.content.slice(0, 100)}{note.content.length > 100 ? '...' : ''}</div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 8 }}>{new Date(note.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
