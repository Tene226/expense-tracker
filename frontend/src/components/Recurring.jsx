import { useState } from 'react';
import { useRecurring } from '../hooks/useRecurring';
import { LG, getCatColor, glassStyle } from '../styles/tokens';
import { Gleam, GlassInput, GlassSelect, GlassButton, SectionHeader } from './Glass';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

function RecurringItem({ item, categories, onApply, onUnapply, onDelete, applying }) {
  const cat = categories.find(c => c.id === item.category);
  const cc = getCatColor(item.category) || cat?.color || LG.tint;
  const isApplying = applying === item.id;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      opacity: item.applied ? 0.7 : 1,
    }}>
      {/* Category icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: `${cc}18`, border: `1px solid ${cc}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: 99, background: cc }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 14, fontWeight: 500, color: LG.textPrimary, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, color: LG.textSecondary, marginTop: 1 }}>
          {item.type === 'income' ? 'Revenu' : (cat?.label || 'Autres')}
          {' · '}
          {item.day_of_month === 31 ? 'fin du mois' : `${item.day_of_month} du mois`}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 500, color: item.type === 'income' ? LG.green : LG.textPrimary }}>
          {item.type === 'income' ? '+' : '−'}{item.amount.toLocaleString('fr-FR')}
        </div>
        {item.applied ? (
          <button onClick={() => onUnapply(item)} disabled={isApplying} style={{
            fontFamily: '-apple-system, system-ui', fontSize: 11, fontWeight: 600,
            color: LG.green, background: `${LG.green}18`, border: `1px solid ${LG.green}44`,
            borderRadius: 8, padding: '2px 8px', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent', opacity: isApplying ? 0.4 : 1,
          }}>
            ✓ Appliqué
          </button>
        ) : (
          <button onClick={() => onApply(item)} disabled={isApplying} style={{
            fontFamily: '-apple-system, system-ui', fontSize: 11, fontWeight: 600,
            color: LG.textSecondary, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '2px 8px', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent', opacity: isApplying ? 0.4 : 1,
          }}>
            {isApplying ? '...' : 'Appliquer'}
          </button>
        )}
      </div>

      <button onClick={() => onDelete(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: 16, padding: '2px 4px', WebkitTapHighlightColor: 'transparent', flexShrink: 0, minHeight: 44, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ×
      </button>
    </div>
  );
}

export default function Recurring({ categories, onRefreshExpenses, onRefreshAccounts }) {
  const [month, setMonth]     = useState(currentMonth());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ name: '', amount: '', type: 'expense', category: 'factures', day_of_month: '1' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving]   = useState(false);
  const [applying, setApplying] = useState(null);
  const months = buildMonthOptions();

  const { items, loading, addItem, removeItem, applyItem, unapplyItem } = useRecurring(month);

  const expenseItems = items.filter(i => i.type === 'expense');
  const incomeItems  = items.filter(i => i.type === 'income');
  const totalExp     = expenseItems.reduce((s, i) => s + i.amount, 0);
  const totalInc     = incomeItems.reduce((s, i) => s + i.amount, 0);
  const appliedExp   = expenseItems.filter(i => i.applied).reduce((s, i) => s + i.amount, 0);
  const appliedInc   = incomeItems.filter(i => i.applied).reduce((s, i) => s + i.amount, 0);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) { setFormError('Nom et montant requis'); return; }
    setSaving(true); setFormError('');
    try {
      await addItem({
        name: form.name.trim(),
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.type === 'expense' ? form.category : 'autres',
        day_of_month: parseInt(form.day_of_month) || 1,
      });
      setForm({ name: '', amount: '', type: 'expense', category: 'factures', day_of_month: '1' });
      setShowAdd(false);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApply(item) {
    setApplying(item.id);
    try {
      await applyItem(item.id);
      onRefreshExpenses?.();
      onRefreshAccounts?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setApplying(null);
    }
  }

  async function handleUnapply(item) {
    if (!window.confirm("Annuler l'application ?")) return;
    setApplying(item.id);
    try {
      await unapplyItem(item.id, item.log.id);
      onRefreshExpenses?.();
      onRefreshAccounts?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setApplying(null);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Supprimer "${item.name}" ?`)) return;
    await removeItem(item.id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0 8px' }}>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 20, fontWeight: 700, color: LG.textPrimary, flex: 1, letterSpacing: '-0.04em' }}>
          Récurrents
        </span>
        <GlassButton label={showAdd ? 'Annuler' : '+ Ajouter'} small onClick={() => setShowAdd(v => !v)} />
      </div>

      {/* Summary pill */}
      {(expenseItems.length > 0 || incomeItems.length > 0) && (
        <div style={{ ...glassStyle(), borderRadius: 16, padding: '14px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          <Gleam />
          <div>
            <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 10, fontWeight: 600, color: LG.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Dépenses prévues
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: LG.textPrimary }}>
              {appliedExp.toLocaleString('fr-FR')}
              <span style={{ color: LG.textSecondary }}> / {totalExp.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 10, fontWeight: 600, color: LG.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Revenus prévus
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, color: LG.green }}>
              {appliedInc.toLocaleString('fr-FR')}
              <span style={{ color: LG.textSecondary }}> / {totalInc.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
        </div>
      )}

      {/* Month selector */}
      <div style={{ marginBottom: 8 }}>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
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

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ ...glassStyle(), borderRadius: 16, padding: 14, marginBottom: 12, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Gleam />
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'expense', category: 'factures' }))}
              style={{ flex: 1, height: 40, background: form.type === 'expense' ? LG.tintGlow : 'transparent', border: 'none', color: form.type === 'expense' ? LG.tint : LG.textSecondary, fontFamily: '-apple-system, system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}>
              Dépense
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, type: 'income', category: 'autres' }))}
              style={{ flex: 1, height: 40, background: form.type === 'income' ? `${LG.green}22` : 'transparent', border: 'none', color: form.type === 'income' ? LG.green : LG.textSecondary, fontFamily: '-apple-system, system-ui', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}>
              Revenu
            </button>
          </div>
          <GlassInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={form.type === 'income' ? 'ex: Salaire…' : 'ex: Netflix, Loyer…'} />
          <div style={{ display: 'flex', gap: 8 }}>
            <GlassInput type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Montant (FCFA)" style={{ flex: 1 }} />
            <GlassInput type="number" value={form.day_of_month} onChange={e => setForm(f => ({ ...f, day_of_month: e.target.value }))} placeholder="Jour" style={{ width: 80 }} />
          </div>
          {form.type === 'expense' && (
            <GlassSelect value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </GlassSelect>
          )}
          {formError && <p style={{ color: LG.red, fontSize: 12, fontFamily: '-apple-system, system-ui' }}>{formError}</p>}
          <GlassButton label={saving ? '...' : 'Enregistrer'} primary full onClick={handleAdd} />
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${LG.sep}`, borderTopColor: LG.textSecondary }} />
        </div>
      )}

      {/* Expense items */}
      {!loading && (
        <>
          <SectionHeader>Dépenses mensuelles</SectionHeader>
          {expenseItems.length === 0 ? (
            <p style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textTertiary, textAlign: 'center', padding: '12px 0' }}>Aucune dépense récurrente</p>
          ) : (
            <div style={{ ...glassStyle(), borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
              <Gleam />
              {expenseItems.map((item, idx) => (
                <div key={item.id} style={{ borderBottom: idx < expenseItems.length - 1 ? `1px solid ${LG.sep}` : 'none' }}>
                  <RecurringItem item={item} categories={categories} onApply={handleApply} onUnapply={handleUnapply} onDelete={handleDelete} applying={applying} />
                </div>
              ))}
            </div>
          )}

          <SectionHeader>Revenus mensuels</SectionHeader>
          {incomeItems.length === 0 ? (
            <p style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textTertiary, textAlign: 'center', padding: '12px 0' }}>Aucun revenu récurrent</p>
          ) : (
            <div style={{ ...glassStyle(), borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 8 }}>
              <Gleam />
              {incomeItems.map((item, idx) => (
                <div key={item.id} style={{ borderBottom: idx < incomeItems.length - 1 ? `1px solid ${LG.sep}` : 'none' }}>
                  <RecurringItem item={item} categories={categories} onApply={handleApply} onUnapply={handleUnapply} onDelete={handleDelete} applying={applying} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Footer total */}
      {!loading && (expenseItems.length > 0 || incomeItems.length > 0) && (
        <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
          <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textTertiary }}>
            Total récurrent ·{' '}
            <span style={{ fontFamily: 'DM Mono, monospace', color: LG.textSecondary }}>
              {totalExp.toLocaleString('fr-FR')} F
            </span>{' '}
            / mois
          </span>
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
