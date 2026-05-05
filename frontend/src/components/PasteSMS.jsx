import { useState } from 'react';
import { pasteSMS } from '../lib/api';
import { LG, providerLabel } from '../styles/tokens';
import { Gleam, GlassInput, GlassButton } from './Glass';

export default function PasteSMS({ fullPage, onBack, onSuccess }) {
  const [smsText, setSmsText] = useState('');
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!smsText.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await pasteSMS(smsText.trim(), date);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Aucune dépense détectable dans ce SMS');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSmsText(''); setResult(null); setError('');
    setDate(new Date().toISOString().slice(0, 10));
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <GlassInput
        value={smsText}
        onChange={e => { setSmsText(e.target.value); setResult(null); setError(''); }}
        placeholder={'Collez ici le SMS reçu…\n\nex: "Paiement de 2 500 F chez Total."'}
        multiline
        rows={4}
      />

      {!result && (
        <>
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

          <GlassButton
            label={loading ? 'Analyse…' : 'Analyser le SMS'}
            primary
            full
            disabled={!smsText.trim() || loading}
            onClick={analyze}
          />
        </>
      )}

      {error && (
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: `${LG.red}18`, border: `1px solid ${LG.red}44`,
          fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.red,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <span>⚠</span>
          <div style={{ flex: 1 }}>
            <div>{error}</div>
            <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${LG.red}99`, fontSize: 12, marginTop: 4, padding: 0, textDecoration: 'underline' }}>
              Réessayer
            </button>
          </div>
        </div>
      )}

      {result && result.success && (
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: `1px solid ${LG.amber}44`,
          background: `${LG.amber}10`,
          position: 'relative',
        }}>
          <Gleam />
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textSecondary }}>Montant</span>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 17, fontWeight: 600, color: LG.amber }}>
                {result.amount?.toLocaleString('fr-FR')} F
              </span>
            </div>
            {result.note && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textSecondary }}>Marchand</span>
                <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 14, color: LG.textPrimary, fontWeight: 500 }}>{result.note}</span>
              </div>
            )}
            {result.provider && result.provider !== 'unknown' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textSecondary }}>Provider</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 99,
                  background: `${LG.amber}22`, border: `1px solid ${LG.amber}55`,
                  fontSize: 11, color: LG.amber, fontFamily: '-apple-system, system-ui',
                }}>
                  {providerLabel(result.provider)}
                </span>
              </div>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${LG.amber}30`, padding: '10px 14px', display: 'flex', gap: 8 }}>
            <GlassButton
              label="Voir dans Historique →"
              full
              onClick={() => onSuccess?.()}
            />
            <GlassButton label="Autre SMS" onClick={reset} />
          </div>
        </div>
      )}
    </div>
  );

  if (!fullPage) return content;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: LG.tint, fontFamily: '-apple-system, system-ui', fontSize: 15, padding: 0, WebkitTapHighlightColor: 'transparent' }}
        >
          ← Retour
        </button>
        <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 17, fontWeight: 600, color: LG.textPrimary, letterSpacing: '-0.03em' }}>
          Import SMS
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {content}
      </div>
    </div>
  );
}
