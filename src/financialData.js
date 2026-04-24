// financialData.js - Dados e estrutura do módulo financeiro

export const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
  RECURRING_EXPENSE: 'recurring_expense',
  RECURRING_INCOME: 'recurring_income',
};

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Alimentação', icon: '🍔', color: '#ff6b6b' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#4ecdc4' },
  { id: 'entertainment', name: 'Entretenimento', icon: '🎮', color: '#ffa502' },
  { id: 'health', name: 'Saúde', icon: '⚕️', color: '#95e1d3' },
  { id: 'utilities', name: 'Contas', icon: '💡', color: '#a8e6cf' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#ff8b94' },
  { id: 'other', name: 'Outro', icon: '📌', color: '#9b9b9b' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salário', icon: '💰', color: '#10b981' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3b82f6' },
  { id: 'investment', name: 'Investimento', icon: '📈', color: '#f59e0b' },
  { id: 'other', name: 'Outro', icon: '✨', color: '#8b5cf6' },
];

// Exemplo de estrutura de transação
export const emptyTransaction = () => ({
  id: Date.now(),
  type: 'expense', // expense | income
  category: 'food',
  amount: 0,
  description: '',
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false,
  recurringFrequency: 'monthly', // daily | weekly | monthly | yearly
});

// Exemplo de meta
export const emptyGoal = () => ({
  id: Date.now(),
  name: '',
  type: 'savings', // savings | spending
  targetAmount: 0,
  category: null,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
});

// Exemplo de lembrete de pagamento
export const emptyPaymentReminder = () => ({
  id: Date.now(),
  name: '',
  amount: 0,
  dueDate: new Date().toISOString().slice(0, 10),
  status: 'pending', // pending | paid
  category: 'utilities',
});
