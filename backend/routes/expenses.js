const express = require('express');
const router = express.Router();
const db = require('../db');

const DEFAULT_CATEGORIES = [
  'alimentation', 'transport', 'sortie', 'shopping', 'sante', 'factures', 'autres',
];

function getValidCategories(userId) {
  const custom = db.prepare('SELECT id FROM custom_categories WHERE user_id = ?').all(userId);
  return [...DEFAULT_CATEGORIES, ...custom.map(c => `cust_${c.id}`)];
}

router.get('/summary', (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;
  let rows;
  if (month) {
    rows = db.prepare(
      "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ? GROUP BY category"
    ).all(userId, month);
  } else {
    rows = db.prepare(
      "SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category"
    ).all(userId);
  }
  res.json(rows);
});

router.get('/', (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;
  let rows;
  if (month) {
    rows = db.prepare(
      "SELECT * FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ? ORDER BY date DESC, created_at DESC"
    ).all(userId, month);
  } else {
    rows = db.prepare(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC'
    ).all(userId);
  }
  res.json(rows);
});

router.post('/', (req, res) => {
  const { amount, category, note, date } = req.body;
  const userId = req.user.id;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount doit être un nombre positif' });
  }
  if (!category || !getValidCategories(userId).includes(category)) {
    return res.status(400).json({ error: 'category invalide' });
  }
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'date invalide (ISO 8601 attendu)' });
  }

  const accountId = req.body.account_id ?? null;
  if (accountId !== null) {
    const acc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
    if (!acc) return res.status(404).json({ error: 'Compte non trouvé' });
  }

  const result = db.prepare(
    'INSERT INTO expenses (user_id, amount, category, note, date, account_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, amount, category, note || '', date, accountId);

  const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(created);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Dépense non trouvée' });
  res.json({ success: true });
});

module.exports = router;
