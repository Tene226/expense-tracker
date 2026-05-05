import { useState } from 'react';
import PasteSMS from './PasteSMS';
import { LG, getCatColor } from '../styles/tokens';
import { Gleam, GlassInput, GlassSelect, GlassPill, GlassButton } from './Glass';
import { DEFAULT_CATEGORIES } from '../hooks/useCategories';

const PALETTE = [
  '#1D9E75','#378ADD','#D4537E','#D85A30','#3B6D11',
  '#534AB7','#5F5E5A','#E6A817','#C0392B','#8E44AD',
];

function CategoryManager({ categories, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const customCats = categories.filter(c => c.custom);

  async function handleAdd(e) {
    e.preventDefault();
    if (!label.trim()) { setError('Nom requis'); return; }
    setSaving(true); setError('');
    try {
      await onAdd({ label: label.trim(), color });
      setLabel(''); setColor(PALETTE[0]); setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ borderTop: `1px solid ${LG.sep}`, paddingTop: 16, marginTop: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, fontWeight: 600, color: LG.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Catégories personnalisées
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={LG.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {customCats.map(cat => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: cat.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: '-apple-system, system-ui', fontSize: 14, color: LG.textPrimary }}>{cat.label}</span>
              <button
                type="button"
                onClick={() => onRemove(cat.db_id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 4 }}
              >
                ✕
              </button>
            </div>
          ))}
          {customCats.length === 0 && !showForm && (
            <p style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textTertiary, textAlign: 'center', padding: '8px 0' }}>
              Aucune catégorie personnalisée
            </p>
          )}
          {showForm ? (
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <GlassInput value={label} onChange={e => setLabel(e.target.value)} placeholder="Nom de la catégorie" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PALETTE.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)} style={{
                    width: 28, height: 28, borderRadius: 99, background: c, cursor: 'pointer',
                    border: color === c ? '2.5px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                    boxShadow: color === c ? `0 0 10px ${c}88` : 'none',
                    transition: 'all 150ms',
                  }} />
                ))}
              </div>
              {error && <p style={{ color: LG.red, fontSize: 12 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <GlassButton label={saving ? '...' : 'Ajouter'} primary full style={{ flex: 1 }} />
                <GlassButton label="Annuler" full onClick={() => { setShowForm(false); setLabel(''); setError(''); }} style={{ flex: 1 }} />
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', height: 40, borderRadius: 12, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
                color: LG.textTertiary, fontFamily: '-apple-system, system-ui', fontSize: 13, fontWeight: 600,
              }}
            >
              + Nouvelle catégorie
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddExpense({ onAdd, onSMSSuccess, accounts = [], categories = DEFAULT_CATEGORIES, onAddCategory, onRemoveCategory }) {
  const [amount, setAmount]       = useState('');
  const [category, setCategory]   = useState(categories[0]?.id || 'alimentation');
  const [note, setNote]           = useState('');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');
  const [flash, setFlash]         = useState(false);
  const [showSMS, setShowSMS]     = useState(false);
  const [error, setError]         = useState('');

  const catObj = categories.find(c => c.id === category) || categories[0];
  const catColor = getCatColor(category) || (catObj?.color) || LG.tint;

  if (showSMS) {
    return (
      <PasteSMS
        fullPage
        onBack={() => setShowSMS(false)}
        onSuccess={() => { setShowSMS(false); onSMSSuccess?.(); }}
      />
    );
  }

  function pressKey(k) {
    setError('');
    if (k === '⌫') { setAmount(a => a.slice(0, -1)); return; }
    if (k === '✓') { handleSave(); return; }
    if (amount.length >= 7) return;
    setAmount(a => a + k);
  }

  async function handleSave() {
    const num = parseInt(amount, 10);
    if (!num || num <= 0) { setError('Montant requis'); return; }
    if (!category) { setError('Catégorie requise'); return; }
    setError('');
    try {
      await onAdd({
        amount: num,
        category,
        note,
        date: new Date(date).toISOString(),
        account_id: accountId ? Number(accountId) : null,
      });
      setFlash(true);
      setTimeout(() => { setFlash(false); setAmount(''); setNote(''); }, 900);
    } catch (e) {
      setError(e.message);
    }
  }

  const displayAmount = amount ? parseInt(amount, 10).toLocaleString('fr-FR') : '0';
  const canConfirm = amount.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 16px' }}>

      {/* Amount hero */}
      <div style={{ textAlign: 'center', padding: '20px 0 12px', position: 'relative' }}>
        <div style={{
          fontFamily: '-apple-system, system-ui',
          fontSize: 58, fontWeight: 300,
          color: flash ? catColor : LG.textPrimary,
          letterSpacing: '-0.04em', lineHeight: 1,
          transition: 'color 200ms ease',
          textShadow: flash ? `0 0 40px ${catColor}88` : 'none',
        }}>
          {displayAmount}
        </div>
        <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 15, color: LG.textSecondary, marginTop: 4, letterSpacing: '-0.02em' }}>
          FCFA
        </div>
        {amount && (
          <div style={{
            position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1,
            background: `linear-gradient(90deg, transparent, ${catColor}66, transparent)`,
          }} />
        )}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 12 }}>
        {categories.map(c => (
          <GlassPill
            key={c.id}
            label={c.label}
            color={getCatColor(c.id) || c.color || LG.tint}
            selected={c.id === category}
            small
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12 }}>
        <GlassInput value={note} onChange={e => setNote(e.target.value)} placeholder="Description…" />

        {/* Date */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1" y="3" width="16" height="14" rx="3" stroke={LG.textTertiary} strokeWidth="1.4" />
            <path d="M1 7h16" stroke={LG.textTertiary} strokeWidth="1.4" />
            <path d="M5 1v3M13 1v3" stroke={LG.textTertiary} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: LG.textPrimary, fontFamily: '-apple-system, system-ui',
              fontSize: 14, letterSpacing: '-0.02em',
            }}
          />
        </div>

        <GlassSelect value={accountId} onChange={e => setAccountId(e.target.value)}>
          <option value="">Sans compte</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </GlassSelect>
      </div>

      {error && (
        <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 10, background: `${LG.red}18`, border: `1px solid ${LG.red}44` }}>
          <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.red }}>{error}</span>
        </div>
      )}

      {/* Numpad */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, paddingBottom: 8 }}>
        {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(k => {
          const isConfirm = k === '✓';
          const isBack    = k === '⌫';
          return (
            <button
              key={k}
              onClick={() => pressKey(k)}
              style={{
                minHeight: 44,
                borderRadius: 14,
                border: isConfirm
                  ? `1px solid ${canConfirm ? catColor + '55' : 'rgba(255,255,255,0.07)'}`
                  : '1px solid rgba(255,255,255,0.08)',
                background: isConfirm
                  ? (flash ? `${LG.green}33` : canConfirm ? `${catColor}22` : 'rgba(255,255,255,0.04)')
                  : isBack ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                color: isConfirm
                  ? (flash ? LG.green : canConfirm ? catColor : LG.textTertiary)
                  : LG.textPrimary,
                fontFamily: isConfirm ? '-apple-system, system-ui' : 'DM Mono, monospace',
                fontSize: isConfirm ? 20 : 22,
                fontWeight: isConfirm ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: canConfirm && isConfirm && !flash ? `0 0 20px ${catColor}22` : 'none',
              }}
            >
              {canConfirm && isConfirm && !flash && <Gleam />}
              {flash && isConfirm ? '✓' : k}
            </button>
          );
        })}
      </div>

      {/* SMS button */}
      <div style={{ marginBottom: 8, flexShrink: 0 }}>
        <button
          onClick={() => setShowSMS(true)}
          style={{
            width: '100%', height: 44,
            display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="16" height="14" viewBox="0 0 18 16" fill="none">
            <rect x="1" y="1" width="16" height="14" rx="4" stroke={LG.textSecondary} strokeWidth="1.4" />
            <path d="M4 5h10M4 9h6" stroke={LG.textSecondary} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textSecondary, flex: 1, textAlign: 'left', letterSpacing: '-0.02em' }}>
            Importer un SMS Mobile Money
          </span>
          <svg width="7" height="12" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
            <path d="M1 1l6 6-6 6" stroke={LG.textTertiary} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Category manager */}
      {onAddCategory && onRemoveCategory && (
        <div style={{ paddingBottom: 16 }}>
          <CategoryManager categories={categories} onAdd={onAddCategory} onRemove={onRemoveCategory} />
        </div>
      )}
    </div>
  );
}
