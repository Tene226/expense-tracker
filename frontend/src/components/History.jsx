import { CATEGORIES } from './AddExpense';
import PendingList from './PendingList';

function fmt(n) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function formatDateGroup(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getCatColor(id) {
  return CATEGORIES.find(c => c.id === id)?.color || '#5F5E5A';
}

function getCatLabel(id) {
  return CATEGORIES.find(c => c.id === id)?.label || id;
}

function groupByDate(expenses) {
  const groups = {};
  [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(exp => {
      const key = exp.date.slice(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(exp);
    });
  return Object.entries(groups);
}

export default function History({ expenses, pending, accounts = [], month, onMonthChange, onDelete, onConfirm, onReject, loading }) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    months.push({ val, label });
  }

  const grouped = groupByDate(expenses);
  const total = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Historique</p>
        <div className="flex items-start justify-between mt-1">
          <select
            value={month}
            onChange={e => onMonthChange(e.target.value)}
            className="text-2xl font-bold text-[#0A0A0A] bg-transparent border-none outline-none appearance-none cursor-pointer capitalize -ml-0.5"
          >
            {months.map(m => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>

          {expenses.length > 0 && (
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-[11px] text-zinc-400 mb-0.5">{expenses.length} dépense{expenses.length > 1 ? 's' : ''}</p>
              <p className="text-lg font-bold tabular-nums text-[#0A0A0A]">{fmt(total)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending */}
      <div className="px-5">
        <PendingList pending={pending} onConfirm={onConfirm} onReject={onReject} accounts={accounts} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-zinc-400 text-sm font-medium">Aucune dépense ce mois</p>
        </div>
      )}

      {/* Grouped expenses */}
      {!loading && (
        <div className="flex flex-col gap-5 px-5 mt-1">
          {grouped.map(([date, exps]) => (
            <div key={date}>
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2 capitalize">
                {formatDateGroup(date)}
              </p>
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                {exps.map((exp, i) => (
                  <div
                    key={exp.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i !== exps.length - 1 ? 'border-b border-zinc-50' : ''
                    }`}
                  >
                    <span
                      className="w-1 h-9 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCatColor(exp.category) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                        {exp.note || getCatLabel(exp.category)}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{getCatLabel(exp.category)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-[#0A0A0A] tabular-nums">
                        {exp.amount.toLocaleString('fr-FR')}
                      </span>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="text-zinc-300 hover:text-red-400 transition-colors duration-150 min-h-[44px] min-w-[36px] flex items-center justify-center cursor-pointer ml-1"
                        aria-label="Supprimer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
