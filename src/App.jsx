import { useState, useEffect, useRef } from 'react';
import { WORKOUTS, MEALS, SUPPLEMENTS, ACTIVITIES, TOTAL_MEALS, emptyDay } from './data';
import { loadAllData, saveDay as saveDayDB, exportAllData } from './storage';
import { generatePDF } from './pdf';
import { DashboardEvolucao } from './DashboardEvolucao';
import { FinanceModule } from './FinanceModule';
import { NotesModule } from './NotesModule';
import { AgendaModule } from './AgendaModule';
import { colors, spacing, radius, getCardStyle, getButtonStyle } from './appStyles';

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
    <div style={{ minHeight: '100vh', background: colors.bgPrimary, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", padding: spacing.xl }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: spacing.xl }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: radius.sm, background: colors.accent }} />)}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent, marginBottom: spacing.sm }}>Meu Mordomo</div>
      <div style={{ fontSize: 13, color: colors.textTertiary, marginBottom: spacing.xxl, textAlign: 'center' }}>Seu assistente pessoal</div>

      <div style={{ marginBottom: spacing.xxl }}>
        <div style={{ fontSize: 12, color: colors.textTertiary, marginBottom: spacing.md, textAlign: 'center' }}>DIGITE O PIN</div>
        <div style={{ display: 'flex', gap: spacing.md }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 48,
              height: 48,
              borderRadius: radius.lg,
              background: pin[i] ? colors.accent : colors.bgCard,
              border: `1px solid ${pin[i] ? colors.accent : 'rgba(255, 255, 255, 0.06)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: colors.textPrimary,
              transition: 'all 0.2s ease',
            }}>
              {pin[i] ? '●' : ''}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: spacing.md, marginBottom: spacing.xxl }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleDigit(String(n))}
            style={{
              ...getButtonStyle('secondary'),
              width: 60,
              height: 60,
              padding: 0,
              fontSize: 18,
              fontWeight: 700,
              opacity: pin.length >= 4 ? 0.5 : 1,
              pointerEvents: pin.length >= 4 ? 'none' : 'auto',
            }}>
            {n}
          </button>
        ))}
      </div>

      <button onClick={handleDelete}
        style={{
          ...getButtonStyle('secondary'),
          marginBottom: shake ? spacing.lg : 0,
          transform: shake ? 'translateX(-5px)' : 'translateX(0)',
          transition: 'all 0.1s ease',
        }}>
        ← Voltar
      </button>

      {error && <div style={{ fontSize: 12, color: colors.error, marginTop: spacing.lg }}>PIN inválido</div>}
    </div>
  );
}

// Seção Home (Treino + Dieta)
function HomeSection({ date, setDate, day, allData, tab, setTab, expMeal, setExpMeal, showMsg, setShowMsg, dEx, tEx, dM, dS, key }) {
  const chgDate = (n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    setDate(d);
  };

  const toggleSp = (mk) => {
    // Implementar toggle de refeição não feita
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
        <button onClick={() => chgDate(-1)} style={{ ...getButtonStyle('secondary'), width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: colors.textTertiary, textTransform: 'capitalize', marginBottom: spacing.sm }}>
            {dateFull(date)}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>Foco no Bucho! 🔥</div>
        </div>
        <button onClick={() => chgDate(1)} style={{ ...getButtonStyle('secondary'), width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: dk(new Date()) === key ? 0.5 : 1, cursor: dk(new Date()) === key ? 'default' : 'pointer' }}>›</button>
      </div>

      <div style={{ marginBottom: spacing.xl, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.md }}>
        {[
          { l: 'Treino', v: `${dEx}/${tEx}`, p: tEx ? (dEx/tEx)*100 : 0 },
          { l: 'Dieta', v: `${dM}/${TOTAL_MEALS}`, p: TOTAL_MEALS ? (dM/TOTAL_MEALS)*100 : 0 },
          { l: 'Suplem.', v: `${dS}/${SUPPLEMENTS.length}`, p: (dS/SUPPLEMENTS.length)*100 },
        ].map((s, i) => (
          <div key={i} style={{ ...getCardStyle(), padding: spacing.lg }}>
            <div style={{ fontSize: 10, color: colors.textTertiary, marginBottom: spacing.sm, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.p === 100 ? colors.accent : colors.textPrimary, marginBottom: spacing.md }}>{s.v}</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: radius.sm, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.p}%`, background: colors.accent, borderRadius: radius.sm, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        ))}
      </div>

      {showMsg && (
        <div style={{ margin: `${spacing.lg}px 0`, padding: spacing.lg, background: 'rgba(16,185,129,0.08)', borderRadius: radius.lg, border: '1px solid rgba(16,185,129,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl }}>
          <div style={{ fontSize: 11, color: '#6ee7b7', lineHeight: 1.5, flex: 1 }}>
            <strong style={{ color: colors.accent }}>Recado:</strong> Surf em jejum • Jantar 1ª hora pós-treino • 2 livres/semana • Não pule o core! 💪
          </div>
          <button onClick={() => setShowMsg(false)} style={{ background: 'none', border: 'none', color: colors.textTertiary, cursor: 'pointer', fontSize: 16, padding: spacing.sm, marginLeft: spacing.md }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: spacing.md, overflowX: 'auto' }}>
        {[{ id: 'treino', l: 'Treino', i: '💪' }, { id: 'comida', l: 'Dieta', i: '🥗' }, { id: 'dia', l: 'Dia', i: '📋' }, { id: 'evolucao', l: 'Evolução', i: '📊' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: radius.md,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === t.id ? colors.bgAccent : 'transparent',
              color: tab === t.id ? colors.accent : colors.textTertiary,
              border: 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {/* Conteúdo dos Tabs - simplified para demonstração */}
      {tab === 'treino' && <div style={{ color: colors.textTertiary }}>Conteúdo de Treino...</div>}
      {tab === 'comida' && <div style={{ color: colors.textTertiary }}>Conteúdo de Dieta...</div>}
      {tab === 'dia' && <div style={{ color: colors.textTertiary }}>Conteúdo do Dia...</div>}
      {tab === 'evolucao' && <DashboardEvolucao supabaseClient={null} userId={null} allData={allData} />}
    </>
  );
}

function MainApp() {
  const [date, setDate] = useState(new Date());
  const [allData, setAllData] = useState({});
  const [tab, setTab] = useState('treino');
  const [expMeal, setExpMeal] = useState(null);
  const [showMsg, setShowMsg] = useState(true);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('home'); // home | finances | notes | agenda
  const [userId] = useState('default-user'); // Pode ser substituído por autenticação real

  const key = dk(date);
  const day = allData[key] || emptyDay();

  // Calcular totais
  const tEx = WORKOUTS[day.wk]?.sections.reduce((acc, s) => acc + s.exercises.length, 0) || 0;
  const dEx = day.ex ? Object.values(day.ex).filter(e => e.done).length : 0;
  const dM = day.mc ? Object.values(day.mc).filter(m => m).length : 0;
  const dS = day.sub ? Object.values(day.sub).filter(s => s).length : 0;

  // Load data
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await loadAllData();
      setAllData(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textPrimary }}>
      ⏳ Carregando...
    </div>
  );

  // MAIN RETURN
  return (
    <div style={{ minHeight: '100vh', background: colors.bgPrimary, color: colors.textPrimary, fontFamily: "'DM Sans', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", position: 'relative' }}>
      <div style={{ position: 'fixed', top: -120, right: -120, width: 400, height: 400, background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ padding: `${spacing.xl}px`, position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: radius.sm, background: colors.accent }} />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.accent, letterSpacing: -0.5 }}>Meu Mordomo</span>
              <span style={{ fontSize: 10, color: colors.textTertiary }}>Seu assistente pessoal</span>
            </div>
          </div>
          <button onClick={() => generatePDF(day, dateFull(date))} style={{ ...getButtonStyle('primary'), padding: `${spacing.sm}px ${spacing.md}px` }}>📄 PDF</button>
        </div>

        {/* Navegação de Seções */}
        <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xxl, overflowX: 'auto', paddingBottom: spacing.md, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'home', label: '🏠 Home', icon: '🏠' },
            { id: 'finances', label: '💰 Financeiro', icon: '💰' },
            { id: 'notes', label: '📝 Anotações', icon: '📝' },
            { id: 'agenda', label: '📅 Agenda', icon: '📅' },
          ].map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: radius.md,
                border: 'none',
                background: section === s.id ? colors.bgAccent : 'transparent',
                color: section === s.id ? colors.accent : colors.textTertiary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}>
              {s.icon}
            </button>
          ))}
        </div>

        {/* Conteúdo das Seções */}
        {section === 'home' && (
          <HomeSection
            date={date}
            setDate={setDate}
            day={day}
            allData={allData}
            tab={tab}
            setTab={setTab}
            expMeal={expMeal}
            setExpMeal={setExpMeal}
            showMsg={showMsg}
            setShowMsg={setShowMsg}
            dEx={dEx}
            tEx={tEx}
            dM={dM}
            dS={dS}
            key={key}
          />
        )}

        {section === 'finances' && <FinanceModule allData={allData} userId={userId} />}

        {section === 'notes' && <NotesModule allData={allData} userId={userId} />}

        {section === 'agenda' && <AgendaModule allData={allData} userId={userId} />}
      </div>

      {/* Footer Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: `${spacing.lg}px ${spacing.xl}px`, paddingBottom: 28, background: 'linear-gradient(transparent, rgba(10,10,15,0.95) 30%)', zIndex: 20 }}>
        <button onClick={() => generatePDF(day, dateFull(date))}
          style={{ width: '100%', padding: `${spacing.lg}px 0`, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`, border: 'none', borderRadius: radius.xl, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 30px rgba(16,185,129,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          📄 Gerar PDF
        </button>
      </div>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');

  if (!authenticated) return <PinScreen onSuccess={() => setAuthenticated(true)} />;
  return <MainApp />;
}

export default App;
