import { useState } from 'react';
import { LG, glassStyle, fmt } from '../styles/tokens';
import { Gleam, GlassInput, GlassSelect, GlassButton } from './Glass';

const ACCOUNT_TYPES = {
  bank:         'Bancaire',
  mobile_money: 'Mobile Money',
  cash:         'Espèces',
  other:        'Autre',
};

const PRESET_COLORS = [
  '#F97316','#14B8A6','#94A3B8','#60A5FA','#F472B6','#A78BFA',
];

// ── Account Form ────────────────────────────────────────────

function AccountForm({ initial, onSave, onCancel }) {
  const [name, setName]     = useState(initial?.name ?? '');
  const [type, setType]     = useState(initial?.type ?? 'other');
  const [balance, setBalance] = useState(initial?.balance_initial ?? 0);
  const [color, setColor]   = useState(initial?.color ?? PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Nom requis'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ name: name.trim(), type, balance_initial: parseFloat(balance) || 0, color });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 16, ...glassStyle(), position: 'relative', marginBottom: 12 }}>
      <Gleam />
      <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 14, fontWeight: 600, color: LG.textPrimary, letterSpacing: '-0.03em' }}>
        {initial ? 'Modifier le compte' : 'Nouveau compte'}
      </div>
      <GlassInput value={name} onChange={e => setName(e.target.value)} placeholder="Nom…" />

      {/* Type grid 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(ACCOUNT_TYPES).map(([k, v]) => {
          const sel = type === k;
          return (
            <button key={k} type="button" onClick={() => setType(k)} style={{
              height: 44, borderRadius: 10,
              background: sel ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${sel ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
              color: sel ? LG.textPrimary : LG.textSecondary,
              fontFamily: '-apple-system, system-ui', fontSize: 13,
              fontWeight: sel ? 600 : 400,
              cursor: 'pointer', transition: 'all 150ms ease',
              WebkitTapHighlightColor: 'transparent',
              letterSpacing: '-0.02em',
              position: 'relative', overflow: 'hidden',
            }}>
              {sel && <Gleam />}
              {v}
            </button>
          );
        })}
      </div>

      <GlassInput type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="Solde initial (FCFA)…" />

      {/* Color palette */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 2 }}>
        {PRESET_COLORS.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)} style={{
            width: 28, height: 28, borderRadius: 99, background: c, cursor: 'pointer', flexShrink: 0,
            border: color === c ? '2.5px solid rgba(255,255,255,0.9)' : '2px solid transparent',
            boxShadow: color === c ? `0 0 10px ${c}88` : 'none',
            transition: 'all 150ms',
          }} />
        ))}
      </div>

      {error && <p style={{ color: LG.red, fontSize: 12, fontFamily: '-apple-system, system-ui' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <GlassButton label={saving ? '...' : (initial ? 'Mettre à jour' : 'Créer')} primary full style={{ flex: 1 }} onClick={handleSubmit} />
        <GlassButton label="Annuler" full style={{ flex: 1 }} onClick={onCancel} />
      </div>
    </form>
  );
}

// ── Transfer Form ────────────────────────────────────────────

function TransferForm({ accounts, onSave, onCancel }) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const [toId, setToId]     = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Montant requis'); return; }
    if (String(fromId) === String(toId)) { setError('Comptes différents requis'); return; }
    setSaving(true); setError('');
    try {
      await onSave({
        from_account_id: Number(fromId), to_account_id: Number(toId),
        amount: parseFloat(amount), note,
        date: new Date(date).toISOString(),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ ...glassStyle(), borderRadius: 16, padding: 14, marginBottom: 10, position: 'relative' }}>
      <Gleam />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <GlassSelect value={fromId} onChange={e => setFromId(e.target.value)} style={{ flex: 1 }}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </GlassSelect>
        <span style={{ color: LG.textSecondary, fontSize: 18, display: 'flex', alignItems: 'center' }}>→</span>
        <GlassSelect value={toId} onChange={e => setToId(e.target.value)} style={{ flex: 1 }}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </GlassSelect>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <GlassInput type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (FCFA)…" />
        <GlassInput value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optionnel)…" />
        <GlassInput type="date" value={date} onChange={e => setDate(e.target.value)} />
        {error && <p style={{ color: LG.red, fontSize: 12, fontFamily: '-apple-system, system-ui' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <GlassButton label={saving ? '...' : 'Valider'} primary full onClick={handleSubmit} style={{ flex: 1 }} />
          <GlassButton label="Annuler" full onClick={onCancel} style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export default function Accounts({ accounts, transfers, loading, onAdd, onEdit, onDelete, onAddTransfer, onDeleteTransfer }) {
  const [showAccountForm, setShowAccountForm]   = useState(false);
  const [editingAccount, setEditingAccount]     = useState(null);
  const [showTransferForm, setShowTransferForm] = useState(false);

  async function handleAddAccount(data) {
    await onAdd(data);
    setShowAccountForm(false);
  }

  async function handleEditAccount(data) {
    await onEdit(editingAccount.id, data);
    setEditingAccount(null);
  }

  async function handleDeleteAccount(account) {
    if (!window.confirm(`Supprimer le compte "${account.name}" ?`)) return;
    try { await onDelete(account.id); } catch (e) { alert(e.message); }
  }

  async function handleAddTransfer(data) {
    await onAddTransfer(data);
    setShowTransferForm(false);
  }

  if (loading && accounts.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${LG.sep}`, borderTopColor: LG.textSecondary }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0 8px' }}>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 20, fontWeight: 700, color: LG.textPrimary, flex: 1, letterSpacing: '-0.04em' }}>
          Comptes
        </span>
        <GlassButton label="+ Compte" small onClick={() => { setShowAccountForm(v => !v); setEditingAccount(null); }} />
      </div>

      {/* Add/Edit form */}
      {showAccountForm && !editingAccount && (
        <AccountForm onSave={handleAddAccount} onCancel={() => setShowAccountForm(false)} />
      )}
      {editingAccount && (
        <AccountForm initial={editingAccount} onSave={handleEditAccount} onCancel={() => setEditingAccount(null)} />
      )}

      {/* Account cards — horizontal scroll */}
      {accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: '-apple-system, system-ui', fontSize: 14, color: LG.textTertiary }}>
          Aucun compte — créez-en un
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
          {accounts.map(acc => (
            <div key={acc.id} style={{
              flexShrink: 0, width: 140, borderRadius: 16, padding: '14px',
              background: `${acc.color}12`,
              backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              border: `1px solid ${acc.color}44`,
              position: 'relative', overflow: 'hidden',
              cursor: 'pointer',
            }}>
              <Gleam />
              <div style={{ position: 'absolute', bottom: -10, right: -10, width: 50, height: 50, borderRadius: 99, background: `${acc.color}22`, filter: 'blur(15px)', pointerEvents: 'none' }} />
              <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, color: `${acc.color}cc`, marginBottom: 6, fontWeight: 500 }}>{acc.name}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 600, color: LG.textPrimary, letterSpacing: '-0.02em' }}>
                {(acc.balance ?? 0).toLocaleString('fr-FR')}
              </div>
              <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 10, color: LG.textTertiary, marginTop: 4 }}>{ACCOUNT_TYPES[acc.type] || 'Autre'}</div>

              {/* Edit/delete buttons */}
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button onClick={() => setEditingAccount(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: '-apple-system, system-ui', padding: '2px 4px' }}>✎</button>
                <button onClick={() => handleDeleteAccount(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${LG.red}88`, fontSize: 11, fontFamily: '-apple-system, system-ui', padding: '2px 4px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfers section */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0 4px' }}>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 15, fontWeight: 600, color: LG.textPrimary, flex: 1, letterSpacing: '-0.03em' }}>
          Virements
        </span>
        {accounts.length >= 2 && (
          <GlassButton label="+ Virement" small onClick={() => setShowTransferForm(v => !v)} />
        )}
      </div>

      {showTransferForm && accounts.length >= 2 && (
        <TransferForm accounts={accounts} onSave={handleAddTransfer} onCancel={() => setShowTransferForm(false)} />
      )}

      {/* Transfers list */}
      <div style={{ ...glassStyle(), borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
        <Gleam />
        {transfers.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: '-apple-system, system-ui', fontSize: 14, color: LG.textTertiary }}>
            Aucun virement
          </div>
        ) : (
          transfers.slice(0, 20).map((t, idx) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px',
              borderBottom: idx < Math.min(transfers.length, 20) - 1 ? `1px solid ${LG.sep}` : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 14, fontWeight: 500, color: LG.textPrimary, letterSpacing: '-0.03em' }}>
                  {t.from_name} → {t.to_name}
                </div>
                {t.note && <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, color: LG.textSecondary, marginTop: 1 }}>{t.note}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 500, color: LG.tint }}>
                  {fmt(t.amount)}
                </div>
                <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 10, color: LG.textTertiary }}>
                  {new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm('Supprimer ce virement ?')) return;
                  await onDeleteTransfer(t.id);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: 16, padding: '2px 4px', WebkitTapHighlightColor: 'transparent', minHeight: 44, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}
