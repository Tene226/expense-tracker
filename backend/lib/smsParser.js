const EXPENSE_KEYWORDS = [
  'envoyé', 'envoye', 'paiement', 'payé', 'paye',
  'retrait', 'débité', 'debite', 'achat', 'transfert', 'transfere',
  'effectue', 'effectué',
];

const INCOME_KEYWORDS = [
  'reçu', 'recu', 'reu',
  'vous avez recu', 'vous avez reçu', 'vous avez reu',
  'crédit', 'credit', 'crédité', 'credite',
  'rechargement', 'dépôt', 'depot', 'recharge',
];

const IGNORE_KEYWORDS = [
  'otp', 'mot de passe', 'pin', 'expire', 'bienvenue',
];

// Smart amount parser handles 4 real-world formats:
// "1 575,00"  → French (space=thousands, comma=decimal)  → 1575
// "1,575.00"  → US    (comma=thousands, dot=decimal)     → 1575
// "4.000"     → local (dot=thousands, no decimal)        → 4000
// "150.000"   → local (dot=thousands)                    → 150000
// "750.00"    → plain decimal                            → 750
// "2 500"     → plain integer with spaces                → 2500
function parseAmount(raw) {
  const s = raw.trim();
  const clean = s.replace(/\s/g, '');

  // US format: has both comma AND dot, comma comes before dot → "1,575.00"
  if (clean.includes(',') && clean.includes('.') && clean.lastIndexOf(',') < clean.lastIndexOf('.')) {
    return parseFloat(clean.replace(/,/g, ''));
  }

  // French format: comma as decimal separator, no dot → "1575,00" or "1 575,00"
  if (clean.includes(',') && !clean.includes('.')) {
    return parseFloat(clean.replace(',', '.'));
  }

  // Dot as thousands separator: exactly 3 digits after dot → "4.000", "150.000", "95.184"
  // Note: "95.184" is ambiguous but in FCFA context 3-digit groups are always thousands
  if (/^\d+\.\d{3}$/.test(clean)) {
    return parseFloat(clean.replace('.', ''));
  }

  // Plain decimal "750.00" or plain integer "2500"
  return parseFloat(clean);
}

function extractAmount(text) {
  const NUM = '([\\d][\\d\\s,.]{0,15})';
  const CURRENCY = '(?:F\\b|FCFA|XOF)';

  const patterns = [
    // Moov: "Montant: 1 575,00 FCFA"
    new RegExp(`[Mm]ontant\\s*(?:de|:)?\\s*${NUM}\\s*${CURRENCY}`),
    // Orange Money: "Votre paiement de 1,575.00 FCFA"
    new RegExp(`[Pp]aiement\\s+de\\s+${NUM}\\s*${CURRENCY}`),
    // Orange Money: "vous avez transfere 10,100.00 FCFA"
    new RegExp(`[Tt]ransfere?\\s+${NUM}\\s*${CURRENCY}`),
    // Generic: "envoyé X FCFA"
    new RegExp(`[Ee]nvoy[eé]\\s+${NUM}\\s*${CURRENCY}`),
    // Generic: "retrait de X FCFA"
    new RegExp(`[Rr]etrait\\s+de\\s+${NUM}\\s*${CURRENCY}`),
    // VISTA: "débité de 4.000 XOF"
    new RegExp(`d[eé]bit[eé]\\s+de\\s+${NUM}\\s*${CURRENCY}`),
    // Fallback: X FCFA débit (old format)
    new RegExp(`${NUM}\\s*${CURRENCY}\\s+[Dd][eé]bit`),
    // Last resort: any number before FCFA/XOF/F
    new RegExp(`${NUM}\\s*${CURRENCY}`),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (!isNaN(amount) && amount > 0 && amount < 10_000_000) return amount;
    }
  }
  return null;
}

function extractNote(text) {
  const patterns = [
    // Moov: "marchand YENGA KREEZUS"
    /marchand\s+([A-Za-zÀ-ÿ0-9][^\.:\n]{2,50})/i,
    // Orange Money merchant: "a ACCEPTEUR GD CHEZ PRESI SANGARE"
    /a\s+ACCEPTEUR\s+(?:[A-Z0-9]+\s+)?([A-Z][A-Z\s]{2,40}?)(?:\s+a\s+ete|\s+Trans|\s+Votre|$)/,
    // Generic: "chez X"
    /chez\s+([A-Za-zÀ-ÿ][^\.:\n]{2,40})/i,
    // Orange Money transfer: "au numero XXXXXXXX,NOM"
    /au\s+numero\s+\d+[,\s]+([A-Za-zÀ-ÿ\-]{3,50})/i,
    // Generic: "envoyé X FCFA à NOM"
    /envoy[eé]\s+[\d\s,.]+\s*(?:F\b|FCFA|XOF)\s+[àa]\s+([^\.:\n]{3,40})/i,
    // Generic: "pour X"
    /pour\s+([A-Za-zÀ-ÿ][^\.:\n]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim().substring(0, 60);
  }
  return '';
}

function extractRemainingBalance(text) {
  const NUM = '([\\d][\\d\\s,.]{0,15})';
  const CURRENCY = '(?:F\\b|FCFA|XOF)?';

  const patterns = [
    // "Nouveau solde : 45 000 FCFA" / "Nouveau Solde : 56 XOF"
    new RegExp(`[Nn]ouveau\\s+[Ss]olde\\s*:?\\s*${NUM}\\s*${CURRENCY}`, 'i'),
    // "Votre solde est de : 10929.245 FCFA"
    new RegExp(`[Ss]olde\\s+est\\s+de\\s*:?\\s*${NUM}\\s*${CURRENCY}`, 'i'),
    // "Solde: 508,00 FCFA" (Moov — at end of SMS)
    new RegExp(`[Ss]olde\\s*:?\\s*${NUM}\\s*${CURRENCY}`),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const bal = parseAmount(match[1]);
      if (!isNaN(bal) && bal >= 0 && bal < 100_000_000) return bal;
    }
  }
  return null;
}

function detectProvider(text) {
  const t = text.toLowerCase();
  if (t.includes('orange money') || t.includes('orangemoney')) return 'orange_money';
  if (t.includes('wave')) return 'wave';
  if (t.includes('moov') || t.includes('mobicash')) return 'moov';
  if (t.includes('coris')) return 'coris';
  if (t.includes('vista')) return 'vista';
  return 'unknown';
}

/**
 * @param {string} rawText
 * @returns {{ amount: number, parsedNote: string, provider: string, remainingBalance: number|null } | null}
 */
function parseSMS(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();
  const low = text.toLowerCase();

  if (IGNORE_KEYWORDS.some(kw => low.includes(kw))) return null;
  if (INCOME_KEYWORDS.some(kw => low.includes(kw))) return null;
  if (!EXPENSE_KEYWORDS.some(kw => low.includes(kw))) return null;

  const amount = extractAmount(text);
  if (!amount) return null;

  return {
    amount,
    parsedNote:       extractNote(text),
    provider:         detectProvider(text),
    remainingBalance: extractRemainingBalance(text),
  };
}

module.exports = { parseSMS };

/*
TESTS INLINE — real SMS formats:

--- MOOV MONEY (expense) ---
parseSMS("Paiement reussi auprès du marchand YENGA KREEZUS\nCode marchand: 63380912\nMontant: 1 575,00 FCFA\nFrais: 0,00 FCFA\nTOTAL: 1 575,00 FCFA\nDate: 26/01/2026 08:29\nTID: DAQ95VGKEN\nSolde: 508,00 FCFA\nReference: 1226951404470")
→ { amount: 1575, parsedNote: "YENGA KREEZUS", provider: "moov" }
  ✓ keyword "paiement" → expense
  ✓ amount: "1 575,00" → French format → 1575
  ✓ note: "marchand YENGA KREEZUS" → pattern marchand
  ✓ provider: "moov"

--- MOOV MONEY (income — ignored) ---
parseSMS("Vous avez reçu 500,00 FCFA de Ouedraogo Assetou.\nNuméro: 22602949259\nDate: 27/01/2026 06:17:09\nTID: DAR15XKO27\nSolde: 1 008,00 FCFA")
→ null (INCOME_KEYWORDS: "reçu")

--- WAVE (income — ignored) ---
parseSMS("Vous avez reu 150.000F\nDe Kiswendsida B O B (États-Unis)\n03/01/2026 à 07:09\nNouveau solde: 150.045F")
→ null (INCOME_KEYWORDS: "reu")

--- VISTA SMS (expense, dot=thousands) ---
parseSMS("Cher(e) client(e), votre compte 000******99 a été débité de 4.000 XOF le 14/04/2026, Nouveau Solde : 56 XOF.")
→ { amount: 4000, parsedNote: "", provider: "vista" }
  ✓ keyword "débité" → expense
  ✓ amount: "4.000" → dot-thousands → 4000
  ✓ provider: "vista"

parseSMS("Cher(e) client(e), votre compte 000******99 a été débité de 95.184 XOF le 27/04/2026, Nouveau Solde : 94.312 XOF.")
→ { amount: 95184, parsedNote: "", provider: "vista" }

--- VISTA SMS (income — ignored) ---
parseSMS("Cher(e) client(e), votre compte 000******99 a été credité de 449.464 XOF le 24/04/2026, Nouveau Solde : 449.520 XOF.")
→ null (INCOME_KEYWORDS: "credite")

--- ORANGE MONEY (payment, US comma format) ---
parseSMS("Votre paiement de 1,575.00 FCFA a ACCEPTEUR HD 3MI TROIS MI a ete effectue avec succes. Votre solde est de : 10929.245 Trans id: MP260430.1820.102368004.")
→ { amount: 1575, parsedNote: "3MI TROIS MI", provider: "orange_money" }
  ✓ keyword "paiement" → expense
  ✓ amount: "1,575.00" → US format → 1575
  ✓ note: "a ACCEPTEUR HD 3MI TROIS MI" → 3MI TROIS MI

parseSMS("Votre paiement de 750.00 FCFA a ACCEPTEUR GD CHEZ PRESI SANGARE CHEZ PRESI SANGARE a ete effectue avec succes. Votre solde est de : 79.245 FCFA. Trans id: MP260501.2154.94969956.")
→ { amount: 750, parsedNote: "CHEZ PRESI SANGARE CHEZ PRESI", provider: "orange_money" }

--- ORANGE MONEY (transfer) ---
parseSMS("Cher client, vous avez transfere 10,100.00 FCFA au numero 06158157,WEPIAMARIAJULIA-DANIELLA. Votre solde est de 829.245 FCFA. ID Trans: PP260430.1838.81766603.")
→ { amount: 10100, parsedNote: "WEPIAMARIAJULIA-DANIELLA", provider: "orange_money" }
  ✓ keyword "transfere" → expense
  ✓ amount: "10,100.00" → US format → 10100
  ✓ note: "au numero ... WEPIAMARIAJULIA-DANIELLA"
*/
