const express = require('express');
const router = express.Router();
const db = require('../db');
const { parseSMS } = require('../lib/smsParser');

const VALID_CATEGORIES = [
  'alimentation', 'transport', 'sortie', 'shopping', 'sante', 'factures', 'autres',
];

router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM pending_expenses ORDER BY created_at DESC'
  ).all();
  res.json(rows);
});

// Sans auth Basic Nginx — sécurisé par WEBHOOK_SECRET
router.post('/webhook', (req, res) => {
  const { secret, sms_text } = req.body;

  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Secret invalide' });
  }
  if (!sms_text) return res.status(400).json({ error: 'sms_text requis' });

  const parsed = parseSMS(sms_text);
  if (!parsed) return res.json({ ignored: true, reason: 'Pas une dépense détectée' });

  db.prepare(`
    INSERT INTO pending_expenses (amount, raw_sms, parsed_note, provider, source, remaining_balance, date)
    VALUES (?, ?, ?, ?, 'webhook', ?, ?)
  `).run(parsed.amount, sms_text, parsed.parsedNote, parsed.provider, parsed.remainingBalance ?? null, new Date().toISOString());

  res.json({ success: true, amount: parsed.amount, note: parsed.parsedNote, remainingBalance: parsed.remainingBalance });
});

// Avec auth Basic via Nginx
router.post('/paste', (req, res) => {
  const { sms_text, date } = req.body;
  if (!sms_text) return res.status(400).json({ error: 'sms_text requis' });

  const parsed = parseSMS(sms_text);
  if (!parsed) {
    return res.status(422).json({
      error: 'Aucune dépense détectable dans ce SMS',
      ignored: true,
    });
  }

  const expenseDate = date && !isNaN(Date.parse(date))
    ? new Date(date).toISOString()
    : new Date().toISOString();

  db.prepare(`
    INSERT INTO pending_expenses (amount, raw_sms, parsed_note, provider, source, remaining_balance, date)
    VALUES (?, ?, ?, ?, 'paste', ?, ?)
  `).run(parsed.amount, sms_text, parsed.parsedNote, parsed.provider, parsed.remainingBalance ?? null, expenseDate);

  res.json({
    success: true,
    amount: parsed.amount,
    note: parsed.parsedNote,
    provider: parsed.provider,
    remainingBalance: parsed.remainingBalance,
  });
});

router.post('/:id/confirm', (req, res) => {
  const { category, note, account_id } = req.body;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category invalide' });
  }

  const pending = db.prepare('SELECT * FROM pending_expenses WHERE id = ?').get(req.params.id);
  if (!pending) return res.status(404).json({ error: 'Pending non trouvé' });

  const accountId = account_id ?? pending.account_id ?? null;
  if (accountId !== null) {
    const acc = db.prepare('SELECT id FROM accounts WHERE id = ?').get(accountId);
    if (!acc) return res.status(404).json({ error: 'Compte non trouvé' });
  }

  db.prepare(
    'INSERT INTO expenses (amount, category, note, date, account_id) VALUES (?, ?, ?, ?, ?)'
  ).run(pending.amount, category, note || pending.parsed_note, pending.date, accountId);

  db.prepare('DELETE FROM pending_expenses WHERE id = ?').run(req.params.id);

  // If SMS had a remaining balance and an account is selected → reconcile
  let balanceSynced = false;
  if (accountId !== null && pending.remaining_balance != null) {
    // Compute current balance for account (after the new expense was inserted)
    const row = db.prepare(`
      SELECT
        a.balance_initial,
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.account_id = ?), 0) AS total_expenses,
        COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.from_account_id = ?), 0) AS total_out,
        COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.to_account_id = ?), 0) AS total_in
      FROM accounts a WHERE a.id = ?
    `).get(accountId, accountId, accountId, accountId);

    if (row) {
      // new_balance_initial = remaining_balance + total_expenses + total_out - total_in
      const newInitial = pending.remaining_balance + row.total_expenses + row.total_out - row.total_in;
      db.prepare('UPDATE accounts SET balance_initial = ? WHERE id = ?').run(newInitial, accountId);
      balanceSynced = true;
    }
  }

  res.json({ success: true, balanceSynced, remainingBalance: pending.remaining_balance });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM pending_expenses WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pending non trouvé' });
  res.json({ success: true });
});

module.exports = router;
