import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jfogpofhrbzjwgsbxyuv.supabase.co',
  'sb_publishable_U9oYnGamRl_nVOmseQUn_A_SN3peIWq'
);

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
        result[row.id] = row.data;
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
