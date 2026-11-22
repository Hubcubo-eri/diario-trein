import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfogpofhrbzjwgsbxyuv.supabase.co',
  'sb_publishable_U9oYnGamRl_nVOmseQUn_A_SN3peIWq'
);

// Mapa de IDs legados → IDs novos (compartilhados entre meses)
const LEGACY_ID_MAP = {
  'c1_1': 'c_prancha_alta',
  'c1_2': 'c_prancha_baixa',
  'c1_3': 'c_elev_pelvica_uni',
  'c1_4': 'c_perdigueiro',
  'c2_1': 'c_prancha_baixa',
  'c2_2': 'c_prancha_lateral',
  'c2_3': 'c_elev_pelvica',
  'm1_1': 'c_supino_reto',
  'm1_2': 'm1a_afundo',
  'm1_3': 'm1a_crucifixo',
  'm1_4': 'c_extensora_uni',
  'm1_5': 'c_triceps_cross',
  'm1_6': 'm1a_panturrilha',
  'm2_1': 'm1b_remada_baixa',
  'm2_2': 'm1b_agachamento',
  'm2_3': 'm1b_pulldown',
  'm2_4': 'c_flexora',
  'm2_5': 'm1b_rosca_halt',
  'm2_6': 'm1b_desenv_ombro',
};

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function migrateLegacyIds(dayData) {
  if (!dayData || !dayData.ex) return dayData;
  const hasLegacyIds = Object.keys(dayData.ex).some(id => LEGACY_ID_MAP[id]);
  if (!hasLegacyIds) return dayData;
  const newEx = {};
  Object.entries(dayData.ex).forEach(([id, val]) => {
    const newId = LEGACY_ID_MAP[id] || id;
    newEx[newId] = val;
  });
  return { ...dayData, ex: newEx };
}

export async function loadAllData() {
  try {
    const { data, error } = await supabase
      .from('days')
      .select('id, data');
    
    if (error) {
      console.error('Load error:', error);
      return {};
    }

    const result = {};
    if (data) {
      data.forEach(row => {
        if (!DATE_KEY_RE.test(String(row.id))) return; // ignora linhas especiais (ex.: config)
        result[row.id] = migrateLegacyIds(row.data);
      });
    }
    return result;
  } catch (e) {
    console.error('Load error:', e);
    return {};
  }
}

export async function saveDay(dateKey, dayData) {
  try {
    const { error } = await supabase
      .from('days')
      .upsert(
        { id: dateKey, data: dayData, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    
    if (error) {
      console.error('Save error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Save error:', e);
    return false;
  }
}

export async function exportAllData() {
  const allData = await loadAllData();
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diario-treino-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Configurações do Bem-Estar (suplementos, meta de água) ───────────────
// Salvas numa linha especial da tabela `days` (id = 'config') e espelhadas
// no localStorage, para funcionar mesmo offline.
const CONFIG_ID = 'config';
const CONFIG_LS = 'cubo-bemestar-config';

export async function loadConfig() {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(CONFIG_LS) || 'null'); } catch { /* ignore */ }
  try {
    const { data, error } = await supabase.from('days').select('data').eq('id', CONFIG_ID).maybeSingle();
    if (!error && data?.data) {
      try { localStorage.setItem(CONFIG_LS, JSON.stringify(data.data)); } catch { /* ignore */ }
      return data.data;
    }
  } catch { /* ignore */ }
  return local;
}

export async function saveConfig(config) {
  try { localStorage.setItem(CONFIG_LS, JSON.stringify(config)); } catch { /* ignore */ }
  try {
    const { error } = await supabase.from('days').upsert(
      { id: CONFIG_ID, data: config, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    return !error;
  } catch { return false; }
}

// ─── Dados do Garmin (gravados pelo GitHub Action garmin/sync.py) ─────────
// Linhas `garmin_AAAA-MM-DD`. Só leitura no app.
export async function loadGarmin() {
  try {
    const { data, error } = await supabase.from('days').select('id, data').like('id', 'garmin_2%');
    if (error || !data) return {};
    const out = {};
    data.forEach(row => { out[String(row.id).slice(7)] = row.data; });
    return out;
  } catch { return {}; }
}
