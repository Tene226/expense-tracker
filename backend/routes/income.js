const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;
  let rows;
  if (month) {
    rows = db.prepare(
      "SELECT * FROM income WHERE user_id = ? AND strftime('%Y-%m', date) = ? ORDER BY date DESC, created_at DESC"
    ).all(userId, month);
  } else {
    rows = db.prepare(
      'SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, created_at DESC'
    ).all(userId);
  }
  res.json(rows);
});

router.get('/summary', (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;
  let total;
  if (month) {
    total = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND strftime('%Y-%m', date) = ?"
    ).get(userId, month);
  } else {
    total = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ?'
    ).get(userId);
  }
  res.json({ total: total.total });
});

router.post('/', (req, res) => {
  const { amount, source, note, date, account_id } = req.body;
  const userId = req.user.id;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount doit être un nombre positif' });
  }
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'date invalide (ISO 8601 attendu)' });
  }

  const accountId = account_id ?? null;
  if (accountId !== null) {
    const acc = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?').get(accountId, userId);
    if (!acc) return res.status(404).json({ error: 'Compte non trouvé' });
  }

  const result = db.prepare(
    'INSERT INTO income (user_id, amount, source, note, date, account_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, amount, source || '', note || '', new Date(date).toISOString(), accountId);

  const created = db.prepare('SELECT * FROM income WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(created);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM income WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entrée non trouvée' });
  res.json({ success: true });
});

module.exports = router;
