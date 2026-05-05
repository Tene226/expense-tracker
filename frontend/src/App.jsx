import { useState, useEffect } from 'react';
import { useExpenses } from './hooks/useExpenses';
import { usePending } from './hooks/usePending';
import { useAccounts } from './hooks/useAccounts';
import { useCategories } from './hooks/useCategories';
import AddExpense from './components/AddExpense';
import Accounts from './components/Accounts';
import History from './components/History';
import Summary from './components/Summary';
import Recurring from './components/Recurring';
import TabBar from './components/TabBar';
import AuthScreen from './components/AuthScreen';
import { LG, glassStyle, getCatColor, fmt } from './styles/tokens';
import { Gleam } from './components/Glass';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(m) {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .toUpperCase();
}

function LGHeader({ expenses, accounts, month }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const catBars = [
    'alimentation','transport','sortie','shopping','sante','factures','autres',
  ].map(id => ({
    id,
    sum: expenses.filter(e => e.category === id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.sum > 0);

  const selAcc = accounts.find(a => a.id === selectedAccountId);
  const displayBal = selAcc
    ? (selAcc.balance ?? 0)
    : accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const displayColor = selAcc ? selAcc.color : LG.tint;

  return (
    <div style={{
      position: 'relative', zIndex: 10,
      padding: 'var(--header-pt, 68px) var(--side-px, 16px) 16px',
      flexShrink: 0,
      borderBottom: `1px solid ${LG.sep}`,
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Left: total */}
        <div>
          <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 12, color: LG.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {monthLabel(month)}
          </div>
          <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 36, fontWeight: 300, color: LG.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {fmt(monthTotal)}
          </div>
          <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 12, color: LG.textSecondary, marginTop: 4, letterSpacing: '-0.01em' }}>
            dépensés ce mois
          </div>
        </div>

        {/* Right: account dropdown */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px 10px 12px', borderRadius: 14,
            ...glassStyle(),
            position: 'relative', overflow: 'hidden',
          }}>
            <Gleam />
            <div style={{ width: 9, height: 9, borderRadius: 99, background: displayColor, boxShadow: `0 0 8px ${displayColor}`, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 17, fontWeight: 500, color: LG.textPrimary, letterSpacing: '-0.02em' }}>
                {fmt(Math.max(0, displayBal))}
              </span>
              <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 9, color: LG.textTertiary, marginTop: 1 }}>
                {selAcc ? selAcc.name : 'Tous les comptes'}
              </span>
            </div>
            <svg width="11" height="7" viewBox="0 0 11 7" style={{ flexShrink: 0, marginLeft: 2 }}>
              <path d="M1 1l4.5 4.5L10 1" stroke={LG.textSecondary} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <select
              value={selectedAccountId ?? 'all'}
              onChange={e => setSelectedAccountId(e.target.value === 'all' ? null : Number(e.target.value))}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            >
              <option value="all">Tous les comptes</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Mini category bars */}
      {monthTotal > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 14, height: 3 }}>
          {catBars.map(cat => (
            <div key={cat.id} style={{
              flex: cat.sum,
              background: getCatColor(cat.id),
              borderRadius: 2,
              boxShadow: `0 0 4px ${getCatColor(cat.id)}88`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState('add');
  const [month, setMonth] = useState(currentMonth());

  const { expenses, summary, loading, addExpense, removeExpense, refresh: refreshExpenses } = useExpenses(month);
  const { pending, confirm, reject, refresh: refreshPending } = usePending();
  const { accounts, transfers, loading: accountsLoading, addAccount, editAccount, removeAccount, addTransfer, removeTransfer, refresh: refreshAccounts } = useAccounts();
  const { categories, addCategory, removeCategory } = useCategories();

  async function handleAddExpense(data) {
    await addExpense(data);
    await refreshAccounts();
  }

  async function handleRemoveExpense(id) {
    await removeExpense(id);
    await refreshAccounts();
  }

  function handleConfirm(id, data) {
    return confirm(id, data, () => Promise.all([refreshExpenses(), refreshAccounts()]));
  }

  async function handleSMSSuccess() {
    await refreshPending();
    setTab('history');
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, system-ui, sans-serif',
    }}>
      {/* Gradient background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: LG.bgGradient }} />
      {/* Blobs */}
      <div style={{ position: 'absolute', top: -60, left: -40, width: 250, height: 250, borderRadius: '99px', background: LG.blob1, filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 100, right: -60, width: 200, height: 200, borderRadius: '99px', background: LG.blob2, filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 100, left: 20, width: 180, height: 180, borderRadius: '99px', background: LG.blob3, filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <LGHeader expenses={expenses} accounts={accounts} month={month} />

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: 0, bottom: 82, overflowY: 'auto', paddingTop: 4 }}>
          {tab === 'add' && (
            <AddExpense
              onAdd={handleAddExpense}
              onSMSSuccess={handleSMSSuccess}
              accounts={accounts}
              categories={categories}
              onAddCategory={addCategory}
              onRemoveCategory={removeCategory}
            />
          )}
          {tab === 'accounts' && (
            <Accounts
              accounts={accounts}
              transfers={transfers}
              loading={accountsLoading}
              onAdd={addAccount}
              onEdit={editAccount}
              onDelete={removeAccount}
              onAddTransfer={addTransfer}
              onDeleteTransfer={removeTransfer}
            />
          )}
          {tab === 'history' && (
            <History
              expenses={expenses}
              pending={pending}
              accounts={accounts}
              categories={categories}
              month={month}
              onMonthChange={setMonth}
              onDelete={handleRemoveExpense}
              onConfirm={handleConfirm}
              onReject={reject}
              loading={loading}
            />
          )}
          {tab === 'recurring' && (
            <Recurring
              categories={categories}
              onRefreshExpenses={refreshExpenses}
              onRefreshAccounts={refreshAccounts}
            />
          )}
          {tab === 'summary' && (
            <Summary
              summary={summary}
              month={month}
              onMonthChange={setMonth}
              categories={categories}
            />
          )}
        </div>

        <TabBar active={tab} onChange={setTab} pendingCount={pending.length} />
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <div className="lg-stage">
      <div className="lg-shell">
        <div className="lg-dynamic-island" />
        <div className="lg-home-indicator" />
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
          {!user
            ? <AuthScreen onAuth={setUser} />
            : <MainApp user={user} onLogout={handleLogout} />
          }
        </div>
      </div>
    </div>
  );
}
