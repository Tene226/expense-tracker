import { DEFAULT_CATEGORIES } from '../hooks/useCategories';
import PendingList from './PendingList';
import { LG, getCatColor, glassStyle } from '../styles/tokens';
import { Gleam, SectionHeader } from './Glass';

function formatDateGroup(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
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

function buildMonthOptions() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    months.push({ val, label });
  }
  return months;
}

export default function History({ expenses, pending, accounts = [], categories = DEFAULT_CATEGORIES, month, onMonthChange, onDelete, onConfirm, onReject, loading }) {
  const months = buildMonthOptions();
  const grouped = groupByDate(expenses);

  function getCatLabel(id) {
    return categories.find(c => c.id === id)?.label || id;
  }
  function catColor(id) {
    return getCatColor(id) || categories.find(c => c.id === id)?.color || LG.tint;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 8px' }}>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 20, fontWeight: 700, color: LG.textPrimary, flex: 1, letterSpacing: '-0.04em' }}>
          Historique
        </span>
        <select
          value={month}
          onChange={e => onMonthChange(e.target.value)}
          style={{
            height: 30, padding: '0 10px',
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            color: LG.textPrimary, fontFamily: '-apple-system, system-ui', fontSize: 12,
            outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
          }}
        >
          {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
      </div>

      {/* Pending */}
      <PendingList pending={pending} onConfirm={onConfirm} onReject={onReject} accounts={accounts} categories={categories} />

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${LG.sep}`, borderTopColor: LG.textSecondary, animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && expenses.length === 0 && pending.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
          <p style={{ fontFamily: '-apple-system, system-ui', fontSize: 15, color: LG.textTertiary }}>
            Aucune dépense ce mois
          </p>
        </div>
      )}

      {/* Grouped expenses */}
      {!loading && grouped.map(([date, exps]) => (
        <div key={date}>
          <SectionHeader>{formatDateGroup(date)}</SectionHeader>
          <div style={{ ...glassStyle(), borderRadius: 16, overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
            <Gleam />
            {exps.map((exp, idx) => {
              const cc = catColor(exp.category);
              const acc = accounts.find(a => a.id === exp.account_id);
              return (
                <div key={exp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px',
                  borderBottom: idx < exps.length - 1 ? `1px solid ${LG.sep}` : 'none',
                }}>
                  {/* Category icon */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: `${cc}18`,
                    border: `1px solid ${cc}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: cc }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 15, fontWeight: 500, color: LG.textPrimary, letterSpacing: '-0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {exp.note || getCatLabel(exp.category)}
                    </div>
                    <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 12, color: LG.textSecondary, marginTop: 1, letterSpacing: '-0.01em' }}>
                      {getCatLabel(exp.category)}{acc ? ` · ${acc.name}` : ''}
                    </div>
                  </div>

                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 500, color: LG.textPrimary, flexShrink: 0 }}>
                    −{exp.amount.toLocaleString('fr-FR')}
                  </div>

                  <button
                    onClick={() => onDelete(exp.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: 18, padding: '2px 4px', WebkitTapHighlightColor: 'transparent', flexShrink: 0, fontFamily: 'system-ui', minHeight: 44, minWidth: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ height: 16 }} />
    </div>
  );
}
