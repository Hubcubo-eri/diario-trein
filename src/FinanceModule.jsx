import { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './financialData';
import { colors, spacing, radius, getCardStyle, getButtonStyle } from './appStyles';
import { saveTransactions, loadTransactions, saveGoals, loadGoals, saveReminders, loadReminders } from './supabaseClient';

export function FinanceModule({ allData = {}, userId = 'default-user' }) {
  const [tab, setTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [newTransaction, setNewTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados ao montar
  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    try {
      const [trans, gls, rems] = await Promise.all([
        loadTransactions(userId),
        loadGoals(userId),
        loadReminders(userId),
      ]);
      setTransactions(trans);
      setGoals(gls);
      setReminders(rems);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  // Salvar transações quando mudarem
  useEffect(() => {
    if (!loading && transactions.length > 0) {
      saveTransactions(userId, transactions);
    }
  }, [transactions, userId, loading]);

  // Salvar goals quando mudarem
  useEffect(() => {
    if (!loading && goals.length > 0) {
      saveGoals(userId, goals);
    }
  }, [goals, userId, loading]);

  // Salvar reminders quando mudarem
  useEffect(() => {
    if (!loading && reminders.length > 0) {
      saveReminders(userId, reminders);
    }
  }, [reminders, userId, loading]);

  // Calcular totais
  const thisMonth = new Date().getMonth() + 1;
  const thisYear = new Date().getFullYear();

  const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'recurring_expense');
  const incomes = transactions.filter(t => t.type === 'income' || t.type === 'recurring_income');

  const totalExpenses = expenses.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalIncomes = incomes.reduce((acc, t) => acc + (t.amount || 0), 0);
  const balance = totalIncomes - totalExpenses;

  // Calcular por categoria
  const expensesByCategory = {};
  expenses.forEach(t => {
    const cat = t.category || 'other';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (t.amount || 0);
  });

  const getCardStyleFinance = () => ({
    ...getCardStyle(),
    marginBottom: spacing.lg,
  });

  return (
    <div style={{ padding: `${spacing.xl}px 0`, maxWidth: 1000, margin: '0 auto' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xl, padding: `0 ${spacing.xl}px`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'dashboard', label: '📊 Resumo', icon: '📊' },
          { id: 'transactions', label: '💳 Transações', icon: '💳' },
          { id: 'goals', label: '🎯 Metas', icon: '🎯' },
          { id: 'reminders', label: '⏰ Lembretes', icon: '⏰' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: `${spacing.md}px ${spacing.lg}px`,
              borderRadius: 0,
              border: 'none',
              background: 'transparent',
              color: tab === t.id ? colors.accent : colors.textTertiary,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: tab === t.id ? `2px solid ${colors.accent}` : 'transparent',
              transition: 'all 0.2s ease',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: `0 ${spacing.xl}px` }}>
        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <>
            {/* KPIs Principais */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg, marginBottom: spacing.xxl }}>
              {[
                { label: 'Receitas', value: `R$ ${totalIncomes.toFixed(2)}`, color: colors.success, icon: '📈' },
                { label: 'Despesas', value: `R$ ${totalExpenses.toFixed(2)}`, color: colors.error, icon: '📉' },
                { label: 'Saldo', value: `R$ ${balance.toFixed(2)}`, color: balance > 0 ? colors.success : colors.error, icon: balance > 0 ? '✅' : '⚠️' },
              ].map((kpi, i) => (
                <div key={i} style={{ ...getCardStyle(), padding: spacing.lg }}>
                  <div style={{ fontSize: 24, marginBottom: spacing.sm }}>{kpi.icon}</div>
                  <div style={{ fontSize: 11, color: colors.textTertiary, marginBottom: spacing.sm, textTransform: 'uppercase', fontWeight: 600 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: kpi.color }}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Despesas por Categoria */}
            <div style={{ ...getCardStyleFinance() }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.lg }}>
                💰 Despesas por Categoria
              </div>
              {Object.keys(expensesByCategory).length === 0 ? (
                <div style={{ color: colors.textTertiary, fontSize: 13, textAlign: 'center', padding: spacing.xl }}>
                  Nenhuma despesa registrada
                </div>
              ) : (
                <div style={{ display: 'grid', gap: spacing.md }}>
                  {Object.entries(expensesByCategory).map(([catId, amount]) => {
                    const category = EXPENSE_CATEGORIES.find(c => c.id === catId);
                    const pct = (amount / totalExpenses * 100).toFixed(0);
                    return (
                      <div key={catId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                          <div style={{ color: colors.textSecondary, fontSize: 13 }}>
                            {category?.icon} {category?.name || catId}
                          </div>
                          <div style={{ color: colors.textPrimary, fontWeight: 600 }}>
                            {pct}% (R$ {amount.toFixed(2)})
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: radius.sm, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: category?.color || colors.accent,
                            borderRadius: radius.sm,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Goals */}
            {goals.length > 0 && (
              <div style={{ ...getCardStyleFinance() }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.lg }}>
                  🎯 Metas
                </div>
                <div style={{ display: 'grid', gap: spacing.md }}>
                  {goals.map(goal => {
                    const progress = Math.random() * 100; // Placeholder
                    return (
                      <div key={goal.id} style={{ padding: spacing.md, background: colors.bgCard, borderRadius: radius.md }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                          <div style={{ fontWeight: 600, color: colors.textPrimary }}>{goal.name}</div>
                          <div style={{ fontSize: 12, color: colors.textTertiary }}>{progress.toFixed(0)}%</div>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: radius.sm, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: colors.accent, borderRadius: radius.sm }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lembretes de Pagamento */}
            {reminders.length > 0 && (
              <div style={{ ...getCardStyleFinance() }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing.lg }}>
                  ⏰ A Pagar
                </div>
                <div style={{ display: 'grid', gap: spacing.md }}>
                  {reminders.filter(r => r.status === 'pending').map(reminder => (
                    <div key={reminder.id} style={{ 
                      padding: spacing.md, 
                      background: colors.bgCard, 
                      borderRadius: radius.md,
                      borderLeft: `3px solid ${colors.error}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: colors.textPrimary }}>{reminder.name}</div>
                          <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>
                            Vencimento: {reminder.dueDate}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: colors.error }}>
                          R$ {reminder.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* TRANSAÇÕES */}
        {tab === 'transactions' && (
          <div>
            <button onClick={() => setNewTransaction({})} style={{ ...getButtonStyle('primary'), marginBottom: spacing.lg }}>
              ➕ Nova Transação
            </button>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: spacing.xxl, color: colors.textTertiary }}>
                Nenhuma transação registrada
              </div>
            ) : (
              <div style={{ display: 'grid', gap: spacing.md }}>
                {transactions.map(t => (
                  <div key={t.id} style={{ ...getCardStyle(), padding: spacing.lg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: colors.textPrimary, fontWeight: 600 }}>{t.description}</div>
                        <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>{t.date}</div>
                      </div>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: t.type.includes('income') ? colors.success : colors.error
                      }}>
                        {t.type.includes('income') ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* METAS */}
        {tab === 'goals' && (
          <div>
            <button onClick={() => {}} style={{ ...getButtonStyle('primary'), marginBottom: spacing.lg }}>
              ➕ Nova Meta
            </button>
            {goals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: spacing.xxl, color: colors.textTertiary }}>
                Nenhuma meta registrada
              </div>
            ) : null}
          </div>
        )}

        {/* LEMBRETES */}
        {tab === 'reminders' && (
          <div>
            <button onClick={() => {}} style={{ ...getButtonStyle('primary'), marginBottom: spacing.lg }}>
              ➕ Novo Lembrete
            </button>
            {reminders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: spacing.xxl, color: colors.textTertiary }}>
                Nenhum lembrete registrado
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
