const express = require('express');
const router = express.Router();
const db = require('../db');

const DEFAULT_CATEGORIES = [
  { id: 'alimentation', label: 'Alimentation', color: '#1D9E75', custom: false },
  { id: 'transport',    label: 'Transport',    color: '#378ADD', custom: false },
  { id: 'sortie',       label: 'Sortie',       color: '#D4537E', custom: false },
  { id: 'shopping',     label: 'Shopping',     color: '#D85A30', custom: false },
  { id: 'sante',        label: 'Santé',        color: '#3B6D11', custom: false },
  { id: 'factures',     label: 'Factures',     color: '#534AB7', custom: false },
  { id: 'autres',       label: 'Autres',       color: '#5F5E5A', custom: false },
];

router.get('/', (req, res) => {
  const custom = db.prepare(
    'SELECT * FROM custom_categories WHERE user_id = ? ORDER BY created_at ASC'
  ).all(req.user.id);

  const customMapped = custom.map(c => ({
    id: `cust_${c.id}`,
    label: c.label,
    color: c.color,
    custom: true,
    db_id: c.id,
  }));

  res.json([...DEFAULT_CATEGORIES, ...customMapped]);
});

router.post('/', (req, res) => {
  const { label, color } = req.body;
  if (!label || !String(label).trim()) return res.status(400).json({ error: 'label requis' });

  const result = db.prepare(
    'INSERT INTO custom_categories (user_id, label, color) VALUES (?, ?, ?)'
  ).run(req.user.id, String(label).trim(), color || '#5F5E5A');

  const created = db.prepare('SELECT * FROM custom_categories WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({
    id: `cust_${created.id}`,
    label: created.label,
    color: created.color,
    custom: true,
    db_id: created.id,
  });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare(
    'DELETE FROM custom_categories WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
  res.json({ success: true });
});

module.exports = router;
