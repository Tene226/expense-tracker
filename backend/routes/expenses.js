const express = require('express');
const router = express.Router();
const db = require('../db');
// db already has accounts table — no extra require needed

const VALID_CATEGORIES = [
  'alimentation', 'transport', 'sortie', 'shopping', 'sante', 'factures', 'autres',
];

router.get('/summary', (req, res) => {
  const { month } = req.query;
  let rows;
  if (month) {
    rows = db.prepare(
      "SELECT category, SUM(amount) as total FROM expenses WHERE strftime('%Y-%m', date) = ? GROUP BY category"
    ).all(month);
  } else {
    rows = db.prepare(
      "SELECT category, SUM(amount) as total FROM expenses GROUP BY category"
    ).all();
  }
  res.json(rows);
});

router.get('/', (req, res) => {
  const { month } = req.query;
  let rows;
  if (month) {
    rows = db.prepare(
      "SELECT * FROM expenses WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC, created_at DESC"
    ).all(month);
  } else {
    rows = db.prepare(
      'SELECT * FROM expenses ORDER BY date DESC, created_at DESC'
    ).all();
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const { amount, category, note, date } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount doit être un nombre positif' });
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category invalide' });
  }
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'date invalide (ISO 8601 attendu)' });
  }

  const accountId = req.body.account_id ?? null;
  if (accountId !== null) {
    const acc = db.prepare('SELECT id FROM accounts WHERE id = ?').get(accountId);
    if (!acc) return res.status(404).json({ error: 'Compte non trouvé' });
  }

  const result = db.prepare(
    'INSERT INTO expenses (amount, category, note, date, account_id) VALUES (?, ?, ?, ?, ?)'
  ).run(amount, category, note || '', date, accountId);

  const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(created);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Dépense non trouvée' });
  res.json({ success: true });
});

module.exports = router;
