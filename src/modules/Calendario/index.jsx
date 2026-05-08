import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfogpofhrbzjwgsbxyuv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2dwb2ZocmJ6andnc2J4eXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI5MjUsImV4cCI6MjA2MDQ5ODkyNX0.MNDMeHvhCrBMTqRJDsgv9Mp2BDR14QhvHGQJQLQlbpY'
);

function haptic(s = 'light') { if (window.navigator?.vibrate) window.navigator.vibrate(s === 'light' ? 10 : 20); }

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const EVENT_COLORS = ['#10b981','#6366f1','#f59e0b','#ef4444','#0ea5e9','#ec4899'];

function dk(d) { return d.toISOString().slice(0, 10); }

// ─── Modal de Evento ──────────────────────────────────────────────────────
function EventModal({ event, date, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(event || {
    title: '', description: '', color: '#10b981', all_day: true,
    start_at: date ? `${date}T09:00` : '', end_at: date ? `${date}T10:00` : '',
  });
  const isEdit = !!event?.id;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#111118', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginBottom: 20 }}>{isEdit ? 'Editar evento' : 'Novo evento'}</div>

        <input placeholder="Título do evento" value={form.title} onChange={e => set('title', e.target.value)}
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f9fafb', fontSize: 15, fontWeight: 600, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

        <textarea placeholder="Descrição..." value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2}
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e5e7eb', fontSize: 13, resize: 'none', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

        {/* Dia inteiro toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 13, color: '#e5e7eb' }}>Dia inteiro</span>
          <button onClick={() => set('all_day', !form.all_day)}
            style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: form.all_day ? '#10b981' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 4, left: form.all_day ? 22 : 4, transition: 'left 0.2s' }} />
          </button>
        </div>

        {/* Data/hora */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Início</div>
            <input type={form.all_day ? 'date' : 'datetime-local'} value={form.all_day ? form.start_at?.slice(0,10) : form.start_at} onChange={e => set('start_at', form.all_day ? e.target.value : e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Fim</div>
            <input type={form.all_day ? 'date' : 'datetime-local'} value={form.all_day ? form.end_at?.slice(0,10) : form.end_at} onChange={e => set('end_at', form.all_day ? e.target.value : e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Cor */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Cor</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {EVENT_COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`, background: c, cursor: 'pointer', transition: 'border 0.15s' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isEdit && (
            <button onClick={() => { haptic('medium'); onDelete(event.id); }}
              style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🗑</button>
          )}
          <button onClick={onClose}
            style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => { if (form.title.trim()) { haptic('medium'); onSave(form); } }}
            style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: form.title.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)', color: form.title.trim() ? '#fff' : '#4b5563', fontSize: 14, fontWeight: 700, cursor: form.title.trim() ? 'pointer' : 'default' }}>
            {isEdit ? 'Salvar' : 'Criar evento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function Calendario({ onBack }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dk(today));
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [eventModal, setEventModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: ev }, { data: tk }] = await Promise.all([
      supabase.from('events').select('*').order('start_at'),
      supabase.from('tasks').select('*').not('due_date', 'is', null).eq('status', 'pending'),
    ]);
    setEvents(ev || []);
    setTasks(tk || []);
    setLoading(false);
  }

  async function saveEvent(form) {
    const payload = {
      ...form,
      start_at: form.all_day ? `${form.start_at.slice(0,10)}T00:00:00` : form.start_at,
      end_at: form.end_at ? (form.all_day ? `${form.end_at.slice(0,10)}T23:59:00` : form.end_at) : null,
    };
    if (form.id) await supabase.from('events').update({ ...payload, updated_at: new Date() }).eq('id', form.id);
    else await supabase.from('events').insert(payload);
    setEventModal(null);
    loadData();
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id);
    setEventModal(null);
    loadData();
  }

  // Gerar dias do mês
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  // Eventos por dia
  const getEventsForDay = (dayStr) => {
    const evs = events.filter(e => e.start_at?.slice(0,10) === dayStr);
    const tks = tasks.filter(t => t.due_date === dayStr);
    return { evs, tks };
  };

  // Eventos do dia selecionado
  const { evs: selectedEvs, tks: selectedTks } = getEventsForDay(selectedDate);

  const cs = { background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" }}>
      {eventModal !== null && (
        <EventModal event={eventModal === 'new' ? null : eventModal} date={selectedDate} onSave={saveEvent} onClose={() => setEventModal(null)} onDelete={deleteEvent} />
      )}

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: '#10b981' }} />)}
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#f9fafb' }}>cubo<span style={{ color: '#10b981' }}>.</span></span>
          </div>
          <button onClick={() => { haptic('light'); setEventModal('new'); }}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>+</button>
        </div>

        {/* Navegação do mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => { haptic('light'); setCurrentMonth(new Date(year, month - 1, 1)); }}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 16, cursor: 'pointer' }}>‹</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb' }}>{MONTHS[month]} {year}</div>
          <button onClick={() => { haptic('light'); setCurrentMonth(new Date(year, month + 1, 1)); }}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9ca3af', fontSize: 16, cursor: 'pointer' }}>›</button>
        </div>

        {/* Dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
          {WEEKDAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', fontWeight: 600, padding: '4px 0' }}>{d}</div>)}
        </div>

        {/* Grid do calendário */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 20 }}>
          {calDays.map((d, i) => {
            if (!d) return <div key={i} />;
            const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isToday = dayStr === dk(today);
            const isSelected = dayStr === selectedDate;
            const { evs, tks } = getEventsForDay(dayStr);
            const hasItems = evs.length > 0 || tks.length > 0;

            return (
              <button key={i} onClick={() => { haptic('light'); setSelectedDate(dayStr); }}
                style={{ aspectRatio: '1', borderRadius: 10, border: 'none', background: isSelected ? '#10b981' : isToday ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: isSelected ? '#fff' : isToday ? '#10b981' : '#e5e7eb', fontSize: 14, fontWeight: isToday || isSelected ? 700 : 400, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative', transition: 'all 0.15s' }}>
                {d}
                {hasItems && !isSelected && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {evs.slice(0,2).map((e, ei) => <div key={ei} style={{ width: 4, height: 4, borderRadius: '50%', background: e.color || '#10b981' }} />)}
                    {tks.length > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Eventos do dia selecionado */}
      <div style={{ padding: '0 20px 100px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>

        {selectedEvs.length === 0 && selectedTks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#4b5563', paddingTop: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 13 }}>Nenhum evento neste dia</div>
            <button onClick={() => { haptic('light'); setEventModal('new'); }}
              style={{ marginTop: 12, padding: '8px 20px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Adicionar evento
            </button>
          </div>
        )}

        {selectedEvs.map(ev => (
          <div key={ev.id} onClick={() => { haptic('light'); setEventModal(ev); }}
            style={{ ...cs, marginBottom: 10, borderLeft: `3px solid ${ev.color || '#10b981'}`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb' }}>{ev.title}</div>
                {ev.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ev.description}</div>}
                {!ev.all_day && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>🕐 {new Date(ev.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{ev.end_at ? ` — ${new Date(ev.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}</div>}
              </div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color || '#10b981', flexShrink: 0 }} />
            </div>
          </div>
        ))}

        {selectedTks.map(task => (
          <div key={task.id} style={{ ...cs, marginBottom: 10, borderLeft: '3px solid #f59e0b', opacity: 0.8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>{task.title}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Tarefa com prazo hoje</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
