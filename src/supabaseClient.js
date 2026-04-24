// supabaseClient.js - Configuração e funções do Supabase

// Se não tiver acesso ao Supabase, vamos usar localStorage como fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || null;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || null;

let supabase = null;

// Carregar Supabase dinamicamente se disponível
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    // import dinâmico será feito apenas se necessário
    console.log('Supabase configurado, usando banco de dados');
  } catch (e) {
    console.log('Supabase não disponível, usando localStorage');
  }
}

// Funções de persistência (Supabase + localStorage fallback)

export const saveTransactions = async (userId, transactions) => {
  const key = `transactions_${userId}`;
  
  if (supabase) {
    try {
      await supabase
        .from('user_data')
        .upsert({ user_id: userId, data_type: 'transactions', data: transactions })
        .select();
    } catch (e) {
      console.error('Erro ao salvar no Supabase:', e);
      localStorage.setItem(key, JSON.stringify(transactions));
    }
  } else {
    localStorage.setItem(key, JSON.stringify(transactions));
  }
};

export const loadTransactions = async (userId) => {
  const key = `transactions_${userId}`;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'transactions')
        .single();
      
      if (data) return data.data || [];
    } catch (e) {
      console.log('Usando localStorage como fallback');
    }
  }
  
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

export const saveNotes = async (userId, notes) => {
  const key = `notes_${userId}`;
  
  if (supabase) {
    try {
      await supabase
        .from('user_data')
        .upsert({ user_id: userId, data_type: 'notes', data: notes })
        .select();
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(notes));
    }
  } else {
    localStorage.setItem(key, JSON.stringify(notes));
  }
};

export const loadNotes = async (userId) => {
  const key = `notes_${userId}`;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'notes')
        .single();
      
      if (data) return data.data || [];
    } catch (e) {
      console.log('Usando localStorage como fallback');
    }
  }
  
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

export const saveGoals = async (userId, goals) => {
  const key = `goals_${userId}`;
  
  if (supabase) {
    try {
      await supabase
        .from('user_data')
        .upsert({ user_id: userId, data_type: 'goals', data: goals })
        .select();
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(goals));
    }
  } else {
    localStorage.setItem(key, JSON.stringify(goals));
  }
};

export const loadGoals = async (userId) => {
  const key = `goals_${userId}`;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'goals')
        .single();
      
      if (data) return data.data || [];
    } catch (e) {
      console.log('Usando localStorage como fallback');
    }
  }
  
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

export const saveReminders = async (userId, reminders) => {
  const key = `reminders_${userId}`;
  
  if (supabase) {
    try {
      await supabase
        .from('user_data')
        .upsert({ user_id: userId, data_type: 'reminders', data: reminders })
        .select();
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(reminders));
    }
  } else {
    localStorage.setItem(key, JSON.stringify(reminders));
  }
};

export const loadReminders = async (userId) => {
  const key = `reminders_${userId}`;
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'reminders')
        .single();
      
      if (data) return data.data || [];
    } catch (e) {
      console.log('Usando localStorage como fallback');
    }
  }
  
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};
