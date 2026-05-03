import { CATEGORIES } from './AddExpense';

function fmt(n) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function formatMonthLabel(monthStr) {
  const [y, m] = monthStr.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function Summary({ summary, month, onMonthChange }) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    months.push({ val, label });
  }

  const total = summary.reduce((acc, row) => acc + row.total, 0);
  const maxAmount = summary.reduce((max, row) => Math.max(max, row.total), 0);

  const rows = CATEGORIES.map(cat => {
    const row = summary.find(s => s.category === cat.id);
    return { ...cat, total: row ? row.total : 0 };
  }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Résumé</p>
        <select
          value={month}
          onChange={e => onMonthChange(e.target.value)}
          className="text-2xl font-bold text-[#0A0A0A] bg-transparent border-none outline-none appearance-none cursor-pointer capitalize -ml-0.5 mt-1"
        >
          {months.map(m => (
            <option key={m.val} value={m.val}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Total hero card */}
      <div className="mx-5 mb-5">
        <div className="bg-[#0A0A0A] rounded-3xl p-6 text-white">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">Total dépensé</p>
          <p className="text-4xl font-bold tabular-nums tracking-tight leading-none">
            {fmt(total)}
          </p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 capitalize">{formatMonthLabel(month)}</p>
            <p className="text-xs text-zinc-500">
              {rows.length} {rows.length > 1 ? 'catégories' : 'catégorie'}
            </p>
          </div>
        </div>
      </div>

      {/* Empty */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-zinc-400 text-sm font-medium">Aucune dépense ce mois</p>
        </div>
      )}

      {/* Category breakdown */}
      <div className="flex flex-col gap-2.5 px-5">
        {rows.map((row, i) => {
          const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
          return (
            <div key={row.id} className="bg-white rounded-2xl px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                  <span className="text-sm font-semibold text-[#0A0A0A]">{row.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 tabular-nums">{pct}%</span>
                  <span className="text-sm font-bold tabular-nums text-[#0A0A0A]">{fmt(row.total)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${maxAmount > 0 ? (row.total / maxAmount) * 100 : 0}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
