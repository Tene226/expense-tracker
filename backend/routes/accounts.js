const express = require('express');
const router = express.Router();
const db = require('../db');

const ACCOUNT_TYPES = ['bank', 'mobile_money', 'cash', 'other'];

function getAccountsWithBalance() {
  return db.prepare(`
    SELECT
      a.*,
      ROUND(
        a.balance_initial
        - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.account_id = a.id), 0)
        - COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.from_account_id = a.id), 0)
        + COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.to_account_id = a.id), 0)
      , 2) AS balance
    FROM accounts a
    ORDER BY a.created_at ASC
  `).all();
}

// ── Comptes ────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  res.json(getAccountsWithBalance());
});

router.post('/', (req, res) => {
  const { name, type, balance_initial, color } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'name requis' });
  if (type && !ACCOUNT_TYPES.includes(type)) return res.status(400).json({ error: 'type invalide' });
  if (balance_initial !== undefined && typeof balance_initial !== 'number') {
    return res.status(400).json({ error: 'balance_initial doit être un nombre' });
  }

  const result = db.prepare(`
    INSERT INTO accounts (name, type, balance_initial, color)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), type || 'other', balance_initial ?? 0, color || '#5F5E5A');

  const created = getAccountsWithBalance().find(a => a.id === Number(result.lastInsertRowid));
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Compte non trouvé' });

  const { name, type, balance_initial, color } = req.body;

  if (name !== undefined && !String(name).trim()) return res.status(400).json({ error: 'name requis' });
  if (type !== undefined && !ACCOUNT_TYPES.includes(type)) return res.status(400).json({ error: 'type invalide' });
  if (balance_initial !== undefined && typeof balance_initial !== 'number') {
    return res.status(400).json({ error: 'balance_initial doit être un nombre' });
  }

  db.prepare(`
    UPDATE accounts SET name = ?, type = ?, balance_initial = ?, color = ? WHERE id = ?
  `).run(
    name !== undefined ? String(name).trim() : account.name,
    type !== undefined ? type : account.type,
    balance_initial !== undefined ? balance_initial : account.balance_initial,
    color !== undefined ? color : account.color,
    req.params.id
  );

  const updated = getAccountsWithBalance().find(a => a.id === Number(req.params.id));
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Compte non trouvé' });

  const expCount = db.prepare('SELECT COUNT(*) as n FROM expenses WHERE account_id = ?').get(req.params.id).n;
  const trfCount = db.prepare(
    'SELECT COUNT(*) as n FROM transfers WHERE from_account_id = ? OR to_account_id = ?'
  ).get(req.params.id, req.params.id).n;

  if (expCount > 0 || trfCount > 0) {
    return res.status(409).json({
      error: `Impossible de supprimer : ${expCount} dépense(s) et ${trfCount} virement(s) liés à ce compte`,
    });
  }

  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Virements ──────────────────────────────────────────────────────────────

router.get('/transfers', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*,
      fa.name as from_name, fa.color as from_color,
      ta.name as to_name,   ta.color as to_color
    FROM transfers t
    JOIN accounts fa ON fa.id = t.from_account_id
    JOIN accounts ta ON ta.id = t.to_account_id
    ORDER BY t.date DESC, t.created_at DESC
  `).all();
  res.json(rows);
});

router.post('/transfers', (req, res) => {
  const { from_account_id, to_account_id, amount, note, date } = req.body;

  if (!from_account_id || !to_account_id) {
    return res.status(400).json({ error: 'Comptes source et destination requis' });
  }
  if (Number(from_account_id) === Number(to_account_id)) {
    return res.status(400).json({ error: 'Les comptes source et destination doivent être différents' });
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount doit être un nombre positif' });
  }
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'date invalide (ISO 8601 attendu)' });
  }

  if (!db.prepare('SELECT id FROM accounts WHERE id = ?').get(from_account_id)) {
    return res.status(404).json({ error: 'Compte source non trouvé' });
  }
  if (!db.prepare('SELECT id FROM accounts WHERE id = ?').get(to_account_id)) {
    return res.status(404).json({ error: 'Compte destination non trouvé' });
  }

  const result = db.prepare(`
    INSERT INTO transfers (from_account_id, to_account_id, amount, note, date)
    VALUES (?, ?, ?, ?, ?)
  `).run(from_account_id, to_account_id, amount, note || '', new Date(date).toISOString());

  const created = db.prepare(`
    SELECT t.*,
      fa.name as from_name, fa.color as from_color,
      ta.name as to_name,   ta.color as to_color
    FROM transfers t
    JOIN accounts fa ON fa.id = t.from_account_id
    JOIN accounts ta ON ta.id = t.to_account_id
    WHERE t.id = ?
  `).get(Number(result.lastInsertRowid));

  res.status(201).json(created);
});

router.delete('/transfers/:id', (req, res) => {
  const result = db.prepare('DELETE FROM transfers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Virement non trouvé' });
  res.json({ success: true });
});

module.exports = router;
