const express = require('express');
const router = express.Router();
const db = require('../db');
const { parseSMS } = require('../lib/smsParser');

const VALID_CATEGORIES = [
  'alimentation', 'transport', 'sortie', 'shopping', 'sante', 'factures', 'autres',
];

// Exported separately — mounted before auth middleware in server.js
// Body: { secret, sms_text, username? }
function webhookHandler(req, res) {
  const { secret, sms_text, username } = req.body;

  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Secret invalide' });
  }
  if (!sms_text) return res.status(400).json({ error: 'sms_text requis' });

  const parsed = parseSMS(sms_text);
  if (!parsed) return res.json({ ignored: true, reason: 'Pas une dépense détectée' });

  // Resolve user: by username if provided, else first registered user
  let userId = null;
  if (username) {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (user) userId = user.id;
  }
  if (!userId) {
    const firstUser = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
    if (!firstUser) return res.status(503).json({ error: 'Aucun utilisateur enregistré' });
    userId = firstUser.id;
  }

  db.prepare(`
    INSERT INTO pending_expenses (user_id, amount, raw_sms, parsed_note, provider, source, remaining_balance, date)
    VALUES (?, ?, ?, ?, ?, 'webhook', ?, ?)
  `).run(userId, parsed.amount, sms_text, parsed.parsedNote, parsed.provider, parsed.remainingBalance ?? null, new Date().toISOString());

  res.json({ success: true, amount: parsed.amount, note: parsed.parsedNote, remainingBalance: parsed.remainingBalance });
}

// All routes below require auth middleware (applied in server.js)

router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM pending_expenses WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json(rows);
});

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
    INSERT INTO pending_expenses (user_id, amount, raw_sms, parsed_note, provider, source, remaining_balance, date)
    VALUES (?, ?, ?, ?, ?, 'paste', ?, ?)
  `).run(req.user.id, parsed.amount, sms_text, parsed.parsedNote, parsed.provider, parsed.remainingBalance ?? null, expenseDate);

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
  const userId = req.user.id;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category invalide' });
  }

  const pending = db.prepare('SELECT * FROM pending_expenses WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!pending) return res.status(404).json({ error: 'Pending non trouvé' });

  const accountId = account_id ?? pending.account_id ?? null;
  if (accountId !== null) {
    const acc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
    if (!acc) return res.status(404).json({ error: 'Compte non trouvé' });
  }

  db.prepare(
    'INSERT INTO expenses (user_id, amount, category, note, date, account_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, pending.amount, category, note || pending.parsed_note, pending.date, accountId);

  db.prepare('DELETE FROM pending_expenses WHERE id = ?').run(req.params.id);

  let balanceSynced = false;
  if (accountId !== null && pending.remaining_balance != null) {
    const row = db.prepare(`
      SELECT
        a.balance_initial,
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.account_id = ?), 0) AS total_expenses,
        COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.from_account_id = ?), 0) AS total_out,
        COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.to_account_id = ?), 0) AS total_in
      FROM accounts a WHERE a.id = ?
    `).get(accountId, accountId, accountId, accountId);

    if (row) {
      const newInitial = pending.remaining_balance + row.total_expenses + row.total_out - row.total_in;
      db.prepare('UPDATE accounts SET balance_initial = ? WHERE id = ?').run(newInitial, accountId);
      balanceSynced = true;
    }
  }

  res.json({ success: true, balanceSynced, remainingBalance: pending.remaining_balance });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM pending_expenses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pending non trouvé' });
  res.json({ success: true });
});

module.exports = { router, webhookHandler };
