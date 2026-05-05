const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { month } = req.query;
  const userId = req.user.id;

  const items = db.prepare(
    "SELECT * FROM recurring_items WHERE user_id = ? AND active = 1 ORDER BY type DESC, day_of_month, name"
  ).all(userId);

  if (month) {
    const logs = db.prepare(
      'SELECT * FROM recurring_logs WHERE user_id = ? AND month = ?'
    ).all(userId, month);

    const logMap = {};
    for (const log of logs) logMap[log.recurring_item_id] = log;

    return res.json(items.map(item => ({
      ...item,
      applied: !!logMap[item.id],
      log: logMap[item.id] || null,
    })));
  }

  res.json(items.map(item => ({ ...item, applied: false, log: null })));
});

router.post('/', (req, res) => {
  const { name, amount, type, category, account_id, day_of_month } = req.body;
  const userId = req.user.id;

  if (!name || !String(name).trim()) return res.status(400).json({ error: 'name requis' });
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount doit être un nombre positif' });
  }
  if (type && !['expense', 'income'].includes(type)) {
    return res.status(400).json({ error: 'type invalide (expense|income)' });
  }

  const result = db.prepare(`
    INSERT INTO recurring_items (user_id, name, amount, type, category, account_id, day_of_month)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    String(name).trim(),
    amount,
    type || 'expense',
    category || 'autres',
    account_id || null,
    Number(day_of_month) || 1
  );

  const created = db.prepare('SELECT * FROM recurring_items WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({ ...created, applied: false, log: null });
});

router.put('/:id', (req, res) => {
  const item = db.prepare(
    'SELECT * FROM recurring_items WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Récurrent non trouvé' });

  const { name, amount, type, category, account_id, day_of_month, active } = req.body;

  db.prepare(`
    UPDATE recurring_items SET name=?, amount=?, type=?, category=?, account_id=?, day_of_month=?, active=? WHERE id=?
  `).run(
    name !== undefined ? String(name).trim() : item.name,
    amount !== undefined ? amount : item.amount,
    type !== undefined ? type : item.type,
    category !== undefined ? category : item.category,
    account_id !== undefined ? account_id : item.account_id,
    day_of_month !== undefined ? Number(day_of_month) : item.day_of_month,
    active !== undefined ? (active ? 1 : 0) : item.active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM recurring_items WHERE id = ?').get(Number(req.params.id));
  res.json({ ...updated, applied: false, log: null });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare(
    'DELETE FROM recurring_items WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Récurrent non trouvé' });
  db.prepare('DELETE FROM recurring_logs WHERE recurring_item_id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/apply', (req, res) => {
  const { month } = req.body;
  const userId = req.user.id;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month requis (YYYY-MM)' });
  }

  const item = db.prepare(
    'SELECT * FROM recurring_items WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);
  if (!item) return res.status(404).json({ error: 'Récurrent non trouvé' });

  const existing = db.prepare(
    'SELECT id FROM recurring_logs WHERE recurring_item_id = ? AND user_id = ? AND month = ?'
  ).get(item.id, userId, month);
  if (existing) return res.status(409).json({ error: 'Déjà appliqué ce mois' });

  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const day = Math.min(item.day_of_month, daysInMonth);
  const date = new Date(year, mon - 1, day).toISOString();

  let expenseId = null;
  let incomeId = null;

  if (item.type === 'expense') {
    const r = db.prepare(
      'INSERT INTO expenses (user_id, amount, category, note, date, account_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, item.amount, item.category || 'autres', item.name, date, item.account_id);
    expenseId = Number(r.lastInsertRowid);
  } else {
    const r = db.prepare(
      'INSERT INTO income (user_id, amount, source, note, date, account_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, item.amount, item.name, '', date, item.account_id);
    incomeId = Number(r.lastInsertRowid);
  }

  const logResult = db.prepare(
    'INSERT INTO recurring_logs (user_id, recurring_item_id, month, expense_id, income_id) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, item.id, month, expenseId, incomeId);

  const log = db.prepare('SELECT * FROM recurring_logs WHERE id = ?').get(Number(logResult.lastInsertRowid));
  res.status(201).json({ success: true, log });
});

router.delete('/:id/apply/:logId', (req, res) => {
  const userId = req.user.id;

  const log = db.prepare(
    'SELECT * FROM recurring_logs WHERE id = ? AND user_id = ?'
  ).get(req.params.logId, userId);
  if (!log) return res.status(404).json({ error: 'Log non trouvé' });

  if (log.expense_id) {
    db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(log.expense_id, userId);
  }
  if (log.income_id) {
    db.prepare('DELETE FROM income WHERE id = ? AND user_id = ?').run(log.income_id, userId);
  }
  db.prepare('DELETE FROM recurring_logs WHERE id = ?').run(log.id);

  res.json({ success: true });
});

module.exports = router;
