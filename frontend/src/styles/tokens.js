export const LG = {
  bgGradient: 'linear-gradient(160deg, #0e1015 0%, #12141a 100%)',
  blob1: 'rgba(184,112,64,0.07)',
  blob2: 'rgba(106,143,175,0.06)',
  blob3: 'rgba(120,184,154,0.05)',
  glass: 'rgba(255,255,255,0.055)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassBlur: 'blur(40px) saturate(180%)',
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(200,210,220,0.50)',
  textTertiary: 'rgba(200,210,220,0.22)',
  sep: 'rgba(255,255,255,0.07)',
  tint: '#B87040',
  tintGlow: 'rgba(184,112,64,0.18)',
  green: '#78B89A',
  red: '#C47A8A',
  amber: '#B87040',
  amberBg: 'rgba(184,112,64,0.09)',
  amberBorder: 'rgba(184,112,64,0.30)',
  catColors: {
    alimentation: '#78B89A',
    transport:    '#6A8FAF',
    sortie:       '#C47A8A',
    shopping:     '#B87040',
    sante:        '#88A870',
    factures:     '#7870B8',
    autres:       '#8A8880',
  },
};

export function glassStyle(overrides = {}) {
  return {
    background: LG.glass,
    backdropFilter: LG.glassBlur,
    WebkitBackdropFilter: LG.glassBlur,
    border: `1px solid ${LG.glassBorder}`,
    ...overrides,
  };
}

export function getCatColor(catId) {
  return LG.catColors[catId] || LG.tint;
}

export function fmt(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0 F';
  return n.toLocaleString('fr-FR') + ' F';
}

export function providerLabel(p) {
  if (p === 'orange_money') return 'Orange Money';
  if (p === 'wave') return 'Wave';
  if (p === 'moov') return 'Moov';
  if (p === 'coris') return 'Coris';
  return 'Mobile Money';
}
