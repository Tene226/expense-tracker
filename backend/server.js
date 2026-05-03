require('dotenv').config();
const express = require('express');
const cors = require('cors');

const expensesRouter = require('./routes/expenses');
const pendingRouter = require('./routes/pending');
const accountsRouter = require('./routes/accounts');

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/accounts', accountsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/pending', pendingRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`Backend démarré sur le port ${PORT}`);
});
