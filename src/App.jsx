import { useState } from 'react';
import HomeMenu from './HomeMenu';
import BemEstar from './modules/BemEstar/index';
import Tarefas from './modules/Tarefas/index';
import Calendario from './modules/Calendario/index';
import Financeiro from './modules/Financeiro/index';

const APP_PIN = '0811';
const AUTH_KEY = 'cubo-diario-auth';

function haptic(s = 'light') { if (window.navigator?.vibrate) window.navigator.vibrate(s === 'light' ? 10 : 20); }

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
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>cubo<span style={{ color: '#10b981' }}>.</span></div>
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
            style={{ width: 68, height: 68, borderRadius: '50%', border: 'none', background: d === '⌫' ? 'transparent' : 'rgba(255,255,255,0.06)', color: d === '⌫' ? '#6b7280' : '#e5e7eb', fontSize: d === '⌫' ? 22 : 24, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  const [module, setModule] = useState(null); // null = home menu

  if (!authed) return <PinScreen onSuccess={() => setAuthed(true)} />;

  if (module === 'bemEstar') return <BemEstar onBack={() => setModule(null)} />;
  if (module === 'tarefas') return <Tarefas onBack={() => setModule(null)} />;
  if (module === 'calendario') return <Calendario onBack={() => setModule(null)} />;
  if (module === 'financeiro') return <Financeiro onBack={() => setModule(null)} />;

  return <HomeMenu onSelect={setModule} />;
}
