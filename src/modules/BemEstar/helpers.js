import { SUPPLEMENTS, ACTIVITIES } from '../../data';

// Chave do dia no fuso LOCAL (toISOString usa UTC e jogava registros
// feitos depois das 21h para o dia seguinte).
export function dk(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nowHHMM() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function haptic(style = 'light') {
  if (window.navigator?.vibrate) {
    window.navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40);
  }
}

export const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// ─── Configuração ─────────────────────────────────────────────────────────
export const LEGACY_CUP_ML = 375; // 8 copos antigos ≈ 3L

export function defaultConfig() {
  return {
    waterGoal: 3000,      // ml/dia
    waterPerWorkout: 700, // ml extras em dia de treino
    cupSizes: [200, 300, 500, 700],
    supplements: SUPPLEMENTS.map(s => ({ ...s })),
  };
}

export function mergeConfig(saved) {
  const def = defaultConfig();
  if (!saved) return def;
  return {
    ...def,
    ...saved,
    cupSizes: Array.isArray(saved.cupSizes) && saved.cupSizes.length ? saved.cupSizes : def.cupSizes,
    supplements: Array.isArray(saved.supplements) ? saved.supplements : def.supplements,
  };
}

// ─── Água ─────────────────────────────────────────────────────────────────
export function waterLog(day) {
  if (Array.isArray(day.waterLog)) return day.waterLog;
  // Dia antigo: só tinha contagem de copos
  if (day.water > 0) return [{ id: 'legacy', ml: day.water * LEGACY_CUP_ML, t: '—', legacy: true }];
  return [];
}

export function waterTotal(day) {
  return waterLog(day).reduce((a, w) => a + num(w.ml), 0);
}

export function trainedToday(day, garmin) {
  if (garmin?.activities?.length) return true;
  const exDone = Object.values(day.ex || {}).some(e => e?.done || e?.series?.some(s => s.done));
  const acts = Object.values(day.act || {}).some(Boolean) || (day.actLog || []).length > 0;
  const livre = !!(day.treinoLivre?.texto || day.treinoLivre?.fotos?.length);
  return exDone || acts || livre;
}

export function waterGoal(day, config, garmin) {
  return config.waterGoal + (trainedToday(day, garmin) ? config.waterPerWorkout : 0);
}

// ─── Comida ───────────────────────────────────────────────────────────────
export const FOOD_MEALS = [
  { id: 'cafe',      label: 'Café',       icon: '☀️' },
  { id: 'lanche1',   label: 'Lanche',     icon: '🍎' },
  { id: 'almoco',    label: 'Almoço',     icon: '🍽️' },
  { id: 'preTreino', label: 'Pré-treino', icon: '⚡' },
  { id: 'jantar',    label: 'Jantar',     icon: '🌙' },
  { id: 'ceia',      label: 'Ceia',       icon: '🌜' },
  { id: 'outro',     label: 'Beliscou',   icon: '🍪' },
];

export function guessMeal() {
  const h = new Date().getHours();
  if (h < 10) return 'cafe';
  if (h < 12) return 'lanche1';
  if (h < 15) return 'almoco';
  if (h < 18) return 'preTreino';
  if (h < 22) return 'jantar';
  return 'ceia';
}

export function foodTotals(day) {
  return (day.food || []).reduce((a, f) => ({ kcal: a.kcal + num(f.kcal), prot: a.prot + num(f.prot) }), { kcal: 0, prot: 0 });
}

// Segunda-feira da semana da data
function weekStart(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return d;
}

export function freeMealsThisWeek(allData, dateKey) {
  const start = weekStart(dateKey);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const day = allData[dk(d)];
    count += (day?.food || []).filter(f => f.livre).length;
  }
  return count;
}

// Sugestões: o que já foi registrado antes (mais recentes primeiro)
export function foodSuggestions(allData) {
  const seen = new Map();
  Object.keys(allData).sort().reverse().forEach(k => {
    (allData[k]?.food || []).forEach(f => {
      const key = (f.desc || '').trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, f);
    });
  });
  return [...seen.values()].slice(0, 60);
}

// ─── Atividades ───────────────────────────────────────────────────────────
export const INTENSITY = [
  { id: 'leve',     label: 'Leve',     color: '#10b981' },
  { id: 'moderada', label: 'Moderada', color: '#f59e0b' },
  { id: 'intensa',  label: 'Intensa',  color: '#ef4444' },
];

export const EXTRA_ACTIVITIES = [
  ...ACTIVITIES,
  { id: 'bike',      label: 'Bike',      icon: '🚴' },
  { id: 'caminhada', label: 'Caminhada', icon: '🚶' },
  { id: 'futebol',   label: 'Futebol',   icon: '⚽' },
  { id: 'beach',     label: 'Beach Tênis', icon: '🎾' },
  { id: 'outra',     label: 'Outra',     icon: '✨' },
];

export function activityMeta(id) {
  return EXTRA_ACTIVITIES.find(a => a.id === id) || { id, label: id, icon: '✨' };
}

// Atividades do dia: log do app + toggles antigos sem detalhes + Garmin
// (atividade do Garmin some da lista quando já foi importada/editada no app)
export function dayActivities(day, garmin) {
  const log = day.actLog || [];
  const fromGarmin = (garmin?.activities || [])
    .filter(g => !log.some(l => l.garminId === g.garminId) && !(day.garminHidden || []).includes(g.garminId))
    .map(g => ({ ...g, fromGarmin: true }));
  const legacy = Object.keys(day.act || {})
    .filter(id => day.act[id] && !log.some(l => l.type === id) && !fromGarmin.some(g => g.type === id))
    .map(id => ({ id: 'legacy_' + id, type: id, legacy: true }));
  return [...log, ...fromGarmin, ...legacy].sort((a, b) => (a.t || '99').localeCompare(b.t || '99'));
}

// Calorias: o que você digitou tem prioridade; se vazio, usa o Garmin
export function effectiveCal(day, garmin) {
  const c = day.cal || {};
  const g = garmin?.cal || {};
  const pick = (k) => (c[k] !== undefined && c[k] !== '' ? c[k] : (g[k] ?? ''));
  const a = pick('a'), b = pick('b');
  let t = pick('t');
  if ((t === '' || t === null) && (a !== '' || b !== '')) t = (parseInt(a) || 0) + (parseInt(b) || 0);
  return { a, b, t };
}

export function fmtSleep(min) {
  if (!min) return '—';
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

// ─── Imagem ───────────────────────────────────────────────────────────────
// Reduz a foto para caber no banco (≈ 50–120 KB)
export function compressImage(file, maxSide = 900, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
