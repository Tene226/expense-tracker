import { useState } from 'react';
import { DEFAULT_CATEGORIES } from '../hooks/useCategories';
import { LG, getCatColor, fmt, providerLabel } from '../styles/tokens';
import { Gleam, GlassInput, GlassSelect, GlassPill } from './Glass';

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export default function PendingCard({ item, onConfirm, onReject, accounts = [], categories = DEFAULT_CATEGORIES }) {
  const [category, setCategory]   = useState('autres');
  const [note, setNote]           = useState(item.parsed_note || '');
  const [accountId, setAccountId] = useState(
    item.account_id ? String(item.account_id) : (accounts.length === 1 ? String(accounts[0].id) : '')
  );
  const [confirming, setConfirming] = useState(false);

  const catColor = getCatColor(category);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm(item.id, {
        category,
        note,
        account_id: accountId ? Number(accountId) : null,
      });
    } finally {
      setConfirming(false);
    }
  }

  async function handleReject() {
    if (!window.confirm('Rejeter cette dépense ?')) return;
    await onReject(item.id);
  }

  const provider = providerLabel(item.provider);

  return (
    <div style={{
      borderRadius: 18, overflow: 'hidden', marginBottom: 10,
      background: `${LG.amber}0e`,
      backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
      border: `1px solid ${LG.amber}44`,
      position: 'relative',
    }}>
      <Gleam />

      {/* Header strip */}
      <div style={{
        padding: '8px 14px',
        borderBottom: `1px solid ${LG.amber}25`,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: 99, background: LG.amber, boxShadow: `0 0 6px ${LG.amber}`, flexShrink: 0 }} />
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, fontWeight: 600, color: LG.amber, flex: 1, letterSpacing: '-0.01em' }}>
          En attente · {provider}
        </span>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 10, color: `${LG.amber}99` }}>
          {item.source === 'webhook' ? '📱 Raccourci' : '📋 Collé'}
        </span>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 10, color: LG.textTertiary, marginLeft: 4 }}>
          {relativeTime(item.created_at)}
        </span>
      </div>

      {/* Amount */}
      <div style={{ padding: '12px 14px 8px' }}>
        <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 30, fontWeight: 300, color: LG.textPrimary, letterSpacing: '-0.04em' }}>
          {fmt(item.amount)}
        </div>
        {item.parsed_note && (
          <div style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textSecondary, marginTop: 2, letterSpacing: '-0.02em' }}>
            "{item.parsed_note}"
          </div>
        )}
      </div>

      {/* Form */}
      <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Category chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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

        <GlassInput value={note} onChange={e => setNote(e.target.value)} placeholder="Description…" />

        <GlassSelect value={accountId} onChange={e => setAccountId(e.target.value)}>
          <option value="">Sans compte</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </GlassSelect>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            style={{
              flex: 2, height: 40, borderRadius: 12,
              background: confirming ? `${LG.green}33` : `${catColor}22`,
              border: `1px solid ${confirming ? LG.green : catColor}55`,
              color: confirming ? LG.green : catColor,
              fontFamily: '-apple-system, system-ui', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 150ms', WebkitTapHighlightColor: 'transparent',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              letterSpacing: '-0.02em',
            }}
          >
            {confirming ? '✓ Confirmé' : '✓ Confirmer'}
          </button>
          <button
            onClick={handleReject}
            disabled={confirming}
            style={{
              flex: 1, height: 40, borderRadius: 12,
              background: `${LG.red}18`, border: `1px solid ${LG.red}44`,
              color: LG.red, fontFamily: '-apple-system, system-ui', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 150ms', WebkitTapHighlightColor: 'transparent',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              letterSpacing: '-0.02em',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
