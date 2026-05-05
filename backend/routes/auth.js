const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username et password requis' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'username trop court (min 3 caractères)' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password trop court (min 6 caractères)' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existing) return res.status(409).json({ error: "Nom d'utilisateur déjà pris" });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)'
  ).run(username.trim(), hash);

  const user = { id: Number(result.lastInsertRowid), username: username.trim() };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username et password requis' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const payload = { id: user.id, username: user.username };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: payload });
});

module.exports = router;
