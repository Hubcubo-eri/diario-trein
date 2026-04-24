import { useState, useEffect } from 'react';
import { colors, spacing, radius, getCardStyle, getButtonStyle } from './appStyles';

export function AgendaModule({ allData = {}, userId = 'default-user' }) {
  const [events, setEvents] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '09:00', description: '' });

  // Carregar Google API
  useEffect(() => {
    loadGoogleApi();
  }, []);

  const loadGoogleApi = () => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Google API carregada
      console.log('Google API loaded');
    };
  };

  const handleLogin = () => {
    setLoading(true);
    // Aqui você implementaria o OAuth2 do Google
    // Por enquanto, vamos simular com localStorage
    const token = localStorage.getItem('google_token');
    if (token) {
      setIsAuthenticated(true);
      loadCalendarEvents();
    } else {
      alert('Configure suas credenciais do Google Calendar');
      // Redirecionar para configuração
    }
    setLoading(false);
  };

  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      // Aqui você faria a chamada para Google Calendar API
      // Simulando com dados locais por enquanto
      const stored = localStorage.getItem('calendar_events');
      const calendarEvents = stored ? JSON.parse(stored) : [];
      setEvents(calendarEvents);
    } catch (e) {
      console.error('Erro ao carregar eventos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Preencha título e data');
      return;
    }

    const event = {
      id: Date.now(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      description: newEvent.description,
      createdAt: new Date().toISOString(),
    };

    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    localStorage.setItem('calendar_events', JSON.stringify(updatedEvents));
    setNewEvent({ title: '', date: '', time: '09:00', description: '' });
    setShowNewEvent(false);
  };

  const deleteEvent = (id) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem('calendar_events', JSON.stringify(updated));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: `${spacing.xxl}px`, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: spacing.lg }}>📅</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.md }}>
          Sua Agenda
        </h2>
        <p style={{ color: colors.textSecondary, marginBottom: spacing.xxl }}>
          Conecte com Google Calendar para sincronizar seus eventos
        </p>
        <button
          onClick={handleLogin}
          style={{ ...getButtonStyle('primary'), padding: `${spacing.md}px ${spacing.xl}px` }}>
          {loading ? '⏳ Conectando...' : '🔗 Conectar Google Calendar'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: `${spacing.xl}px 0`, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl, padding: `0 ${spacing.xl}px` }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>📅 Agenda</h2>
        <button onClick={() => setShowNewEvent(!showNewEvent)} style={{ ...getButtonStyle('primary'), padding: `${spacing.sm}px ${spacing.md}px` }}>
          {showNewEvent ? '✕ Cancelar' : '➕ Novo Evento'}
        </button>
      </div>

      {showNewEvent && (
        <div style={{ ...getCardStyle(), padding: spacing.lg, marginBottom: spacing.xl, marginLeft: spacing.xl, marginRight: spacing.xl }}>
          <input
            type="text"
            placeholder="Título do evento"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            style={{
              width: '100%',
              padding: spacing.md,
              background: colors.bgCard,
              border: `1px solid rgba(255,255,255,0.06)`,
              borderRadius: radius.md,
              color: colors.textPrimary,
              marginBottom: spacing.md,
              fontSize: 13,
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              outline: 'none',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              style={{
                padding: spacing.md,
                background: colors.bgCard,
                border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: radius.md,
                color: colors.textPrimary,
                fontSize: 13,
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                outline: 'none',
              }}
            />
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              style={{
                padding: spacing.md,
                background: colors.bgCard,
                border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: radius.md,
                color: colors.textPrimary,
                fontSize: 13,
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                outline: 'none',
              }}
            />
          </div>
          <textarea
            placeholder="Descrição (opcional)"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            style={{
              width: '100%',
              minHeight: 80,
              padding: spacing.md,
              background: colors.bgCard,
              border: `1px solid rgba(255,255,255,0.06)`,
              borderRadius: radius.md,
              color: colors.textPrimary,
              marginBottom: spacing.md,
              fontSize: 13,
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <button onClick={handleAddEvent} style={{ ...getButtonStyle('primary'), width: '100%' }}>
            ✓ Adicionar Evento
          </button>
        </div>
      )}

      <div style={{ padding: `0 ${spacing.xl}px` }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing.xxl, color: colors.textTertiary }}>
            <div style={{ fontSize: 14, marginBottom: spacing.md }}>Nenhum evento agendado</div>
            <div style={{ fontSize: 12 }}>Crie seu primeiro evento! 👆</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: spacing.lg }}>
            {events
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(event => (
                <div key={event.id} style={{ ...getCardStyle(), padding: spacing.lg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.md }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.sm }}>
                        {event.title}
                      </div>
                      <div style={{ display: 'flex', gap: spacing.lg, fontSize: 12, color: colors.textTertiary }}>
                        <span>📅 {formatDate(event.date)}</span>
                        <span>🕐 {event.time}</span>
                      </div>
                      {event.description && (
                        <div style={{ marginTop: spacing.md, fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>
                          {event.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      style={{ ...getButtonStyle('secondary'), padding: `${spacing.sm}px ${spacing.md}px`, fontSize: 12 }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
