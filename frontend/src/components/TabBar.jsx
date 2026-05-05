import { LG, glassStyle } from '../styles/tokens';
import { Gleam } from './Glass';

const TABS = [
  {
    id: 'add', label: 'Ajouter',
    svg: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" />
        <path d="M12 8v8M8 12h8" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'accounts', label: 'Comptes',
    svg: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="4" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" />
        <path d="M2 11h20" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" />
        <circle cx="17" cy="15.5" r="1.5" fill={a ? LG.tint : LG.textSecondary} />
      </svg>
    ),
  },
  {
    id: 'history', label: 'Historique',
    svg: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 6h11M9 12h11M9 18h11" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="5" cy="6"  r="1.5" fill={a ? LG.tint : LG.textSecondary} />
        <circle cx="5" cy="12" r="1.5" fill={a ? LG.tint : LG.textSecondary} />
        <circle cx="5" cy="18" r="1.5" fill={a ? LG.tint : LG.textSecondary} />
      </svg>
    ),
  },
  {
    id: 'recurring', label: 'Récurrents',
    svg: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 12c0-4.4 3.6-8 8-8 2.5 0 4.7 1.1 6.2 2.8" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M20 12c0 4.4-3.6 8-8 8-2.5 0-4.7-1.1-6.2-2.8" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17.2 4.5l1.8 2.8-2.8.8" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.8 19.5l-1.8-2.8 2.8-.8" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'summary', label: 'Résumé',
    svg: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" />
        <path d="M7 15l3.5-4 3 3 4-5" stroke={a ? LG.tint : LG.textSecondary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function TabBar({ active, onChange, pendingCount }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 82,
      paddingBottom: 22,
      display: 'flex',
      zIndex: 100,
      ...glassStyle(),
      borderRadius: '24px 24px 0 0',
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
    }}>
      <Gleam />
      {TABS.map(t => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2,
              background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Pending badge */}
            {t.id === 'history' && pendingCount > 0 && (
              <div style={{
                position: 'absolute', top: 6, left: '50%', marginLeft: 4,
                minWidth: 15, height: 15, borderRadius: 99,
                background: LG.red,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                boxShadow: `0 0 8px ${LG.red}88`,
                zIndex: 10,
              }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: '#fff', fontWeight: 700 }}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              </div>
            )}

            {t.svg(isActive)}

            <span style={{
              fontFamily: '-apple-system, system-ui',
              fontSize: 9,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? LG.tint : LG.textSecondary,
              letterSpacing: '-0.01em',
            }}>
              {t.label}
            </span>

            {/* Active indicator line */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '25%', right: '25%',
                height: 2, borderRadius: 99,
                background: `linear-gradient(90deg, transparent, ${LG.tint}, transparent)`,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
