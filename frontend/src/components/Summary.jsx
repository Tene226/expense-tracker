import { useState, useEffect } from 'react';
import { DEFAULT_CATEGORIES } from '../hooks/useCategories';
import { getIncomeSummary } from '../lib/api';
import { LG, getCatColor, glassStyle, fmt } from '../styles/tokens';
import { Gleam } from './Glass';

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

export default function Summary({ summary, month, onMonthChange, categories = DEFAULT_CATEGORIES }) {
  const [incomeTotal, setIncomeTotal] = useState(0);
  const months = buildMonthOptions();

  useEffect(() => {
    getIncomeSummary(month)
      .then(data => setIncomeTotal(data.total))
      .catch(() => setIncomeTotal(0));
  }, [month]);

  const totalExpenses = summary.reduce((acc, row) => acc + row.total, 0);
  const maxAmount = summary.reduce((max, row) => Math.max(max, row.total), 0);

  const rows = categories.map(cat => {
    const row = summary.find(s => s.category === cat.id);
    return { ...cat, total: row ? row.total : 0 };
  }).filter(r => r.total > 0);

  const knownIds = new Set(categories.map(c => c.id));
  const orphanRows = summary
    .filter(s => !knownIds.has(s.category))
    .map(s => ({ id: s.category, label: s.category, color: LG.catColors.autres, total: s.total }));

  const allRows = [...rows, ...orphanRows].sort((a, b) => b.total - a.total);

  const catBars = allRows.filter(r => r.total > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 8px' }}>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 20, fontWeight: 700, color: LG.textPrimary, flex: 1, letterSpacing: '-0.04em' }}>
          Résumé
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

      {/* Hero card */}
      <div style={{
        borderRadius: 20, padding: '20px 18px 16px',
        marginBottom: 16, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(184,112,64,0.15), rgba(106,143,175,0.10))',
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.14)',
      }}>
        <Gleam />
        {/* Glow blob */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 99, background: 'rgba(184,112,64,0.12)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 12, color: LG.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Total dépensé
        </div>
        <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 38, fontWeight: 300, color: LG.textPrimary, letterSpacing: '-0.04em', marginTop: 4 }}>
          {fmt(totalExpenses)}
        </div>

        {incomeTotal > 0 && (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.green }}>
              +{fmt(incomeTotal)} revenus
            </span>
            <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textSecondary, marginLeft: 8 }}>
              · solde net : {fmt(incomeTotal - totalExpenses)}
            </span>
          </div>
        )}

        {catBars.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 12, height: 5 }}>
            {catBars.map(cat => (
              <div key={cat.id} style={{
                flex: cat.total,
                background: getCatColor(cat.id) || cat.color || LG.tint,
                borderRadius: 3,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Category list */}
      {allRows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: '-apple-system, system-ui', fontSize: 14, color: LG.textTertiary }}>
          Aucune dépense ce mois
        </div>
      ) : (
        <div style={{ ...glassStyle(), borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
          <Gleam />
          {allRows.map((row, idx) => {
            const cc = getCatColor(row.id) || row.color || LG.tint;
            const pct = totalExpenses > 0 ? Math.round((row.total / totalExpenses) * 100) : 0;
            return (
              <div key={row.id} style={{
                padding: '13px 16px',
                borderBottom: idx < allRows.length - 1 ? `1px solid ${LG.sep}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: cc, flexShrink: 0 }} />
                  <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 15, fontWeight: 500, color: LG.textPrimary, flex: 1, letterSpacing: '-0.03em' }}>
                    {row.label}
                  </span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 500, color: LG.textPrimary }}>
                    {fmt(row.total)}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                  <div style={{
                    height: '100%',
                    width: `${maxAmount > 0 ? (row.total / maxAmount) * 100 : 0}%`,
                    background: `linear-gradient(90deg, ${cc}cc, ${cc})`,
                    borderRadius: 99,
                    transition: 'width 400ms ease',
                  }} />
                </div>
                <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, color: LG.textTertiary, marginTop: 4 }}>
                  {pct}% du total
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
