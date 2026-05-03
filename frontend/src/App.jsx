import { useState } from 'react';
import { useExpenses } from './hooks/useExpenses';
import { usePending } from './hooks/usePending';
import { useAccounts } from './hooks/useAccounts';
import AddExpense from './components/AddExpense';
import Accounts from './components/Accounts';
import History from './components/History';
import Summary from './components/Summary';
import TabBar from './components/TabBar';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function App() {
  const [tab, setTab] = useState('add');
  const [month, setMonth] = useState(currentMonth());

  const { expenses, summary, loading, addExpense, removeExpense, refresh: refreshExpenses } = useExpenses(month);
  const { pending, confirm, reject, refresh: refreshPending } = usePending();
  const {
    accounts, transfers, loading: accountsLoading,
    addAccount, editAccount, removeAccount,
    addTransfer, removeTransfer,
    refresh: refreshAccounts,
  } = useAccounts();

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
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="max-w-[430px] mx-auto pb-24">
        {tab === 'add' && (
          <AddExpense onAdd={handleAddExpense} onSMSSuccess={handleSMSSuccess} accounts={accounts} />
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
            month={month}
            onMonthChange={setMonth}
            onDelete={handleRemoveExpense}
            onConfirm={handleConfirm}
            onReject={reject}
            loading={loading}
          />
        )}
        {tab === 'summary' && (
          <Summary
            summary={summary}
            month={month}
            onMonthChange={setMonth}
          />
        )}
      </div>

      <TabBar active={tab} onChange={setTab} pendingCount={pending.length} />
    </div>
  );
}
