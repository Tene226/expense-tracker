import { LG, glassStyle } from '../styles/tokens';

export function Gleam({ style }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
      borderRadius: 99,
      pointerEvents: 'none',
      ...style,
    }} />
  );
}

export function GlassCard({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...glassStyle(),
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Gleam />
      {children}
    </div>
  );
}

export function GlassInput({ value, onChange, placeholder, multiline, rows, style, type }) {
  const base = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: LG.textPrimary,
    fontFamily: '-apple-system, system-ui',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: '-0.02em',
    caretColor: LG.tint,
    minHeight: 44,
    ...style,
  };
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 4}
        style={{ ...base, resize: 'none', lineHeight: 1.5 }}
      />
    );
  }
  return (
    <input
      type={type || 'text'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={base}
    />
  );
}

export function GlassSelect({ value, onChange, children, style }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        height: 44,
        padding: '0 14px',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        color: LG.textPrimary,
        fontFamily: '-apple-system, system-ui',
        fontSize: 15,
        outline: 'none',
        appearance: 'none',
        WebkitAppearance: 'none',
        letterSpacing: '-0.02em',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

export function GlassButton({ label, primary, danger, disabled, onClick, full, small, style, children }) {
  const color = danger ? LG.red : primary ? LG.tint : LG.textPrimary;
  const bg    = danger ? `${LG.red}18` : primary ? LG.tintGlow : 'rgba(255,255,255,0.07)';
  const brd   = danger ? `1px solid ${LG.red}55` : primary ? `1px solid ${LG.tint}55` : '1px solid rgba(255,255,255,0.12)';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: full ? '100%' : undefined,
        height: small ? 34 : 44,
        padding: small ? '0 14px' : '0 20px',
        borderRadius: small ? 10 : 14,
        background: disabled ? 'rgba(255,255,255,0.04)' : bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: disabled ? '1px solid rgba(255,255,255,0.07)' : brd,
        color: disabled ? LG.textTertiary : color,
        fontFamily: '-apple-system, system-ui',
        fontSize: small ? 13 : 15,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 150ms ease',
        WebkitTapHighlightColor: 'transparent',
        letterSpacing: '-0.02em',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexShrink: 0,
        ...style,
      }}
    >
      {!disabled && <Gleam />}
      {label || children}
    </button>
  );
}

export function GlassPill({ label, color, selected, small, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? '3px 10px' : '5px 14px',
        borderRadius: 99,
        border: selected ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.15)',
        background: selected ? `${color}22` : 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: selected ? color : LG.textSecondary,
        fontFamily: '-apple-system, system-ui',
        fontSize: small ? 12 : 13,
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        WebkitTapHighlightColor: 'transparent',
        letterSpacing: '-0.01em',
        position: 'relative',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {selected && <Gleam />}
      {label}
    </button>
  );
}

export function SectionHeader({ children, style }) {
  return (
    <div style={{
      fontFamily: '-apple-system, system-ui',
      fontSize: 12,
      fontWeight: 600,
      color: LG.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '18px 4px 6px',
      ...style,
    }}>
      {children}
    </div>
  );
}
