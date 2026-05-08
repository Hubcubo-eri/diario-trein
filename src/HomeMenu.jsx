function haptic(s = 'light') { if (window.navigator?.vibrate) window.navigator.vibrate(s === 'light' ? 10 : 20); }

const MODULES = [
  {
    id: 'bemEstar',
    label: 'Bem-Estar',
    desc: 'Treino, dieta e evolução',
    icon: '💪',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    desc: 'Gestão de tarefas e notas',
    icon: '✅',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.25)',
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    desc: 'Contas, gastos e metas',
    icon: '💵',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'calendario',
    label: 'Calendário',
    desc: 'Compromissos e agenda',
    icon: '📅',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.1)',
    border: 'rgba(14,165,233,0.25)',
  },
];

export default function HomeMenu({ onSelect }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0a0a0f, #111118, #0d1117)', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif", padding: '0 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Glow de fundo */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: '#10b981' }} />)}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', letterSpacing: -0.5 }}>cubo<span style={{ color: '#10b981' }}>.</span></span>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'capitalize', marginBottom: 6 }}>{dateStr}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f9fafb', lineHeight: 1.2 }}>{greeting} 👋</div>
        <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>O que vamos fazer hoje?</div>
      </div>

      {/* Cards dos módulos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => { haptic('light'); onSelect(m.id); }}
            style={{ width: '100%', padding: '22px 24px', borderRadius: 20, border: `1px solid ${m.border}`, background: m.bg, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 20, transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
            {/* Ícone */}
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${m.color}20`, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              {m.icon}
            </div>
            {/* Texto */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{m.desc}</div>
            </div>
            {/* Seta */}
            <div style={{ fontSize: 20, color: m.color, opacity: 0.7 }}>›</div>
          </button>
        ))}
      </div>

      <div style={{ paddingBottom: 48, paddingTop: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#2a2a3a' }}>cubo. · todos os módulos</div>
      </div>
    </div>
  );
}
