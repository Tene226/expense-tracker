require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const { router: pendingRouter, webhookHandler } = require('./routes/pending');
const expensesRouter = require('./routes/expenses');
const accountsRouter = require('./routes/accounts');
const categoriesRouter = require('./routes/categories');
const incomeRouter = require('./routes/income');
const recurringRouter = require('./routes/recurring');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(express.json());

// Public routes — no JWT required
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.post('/api/pending/webhook', webhookHandler);

// Protected routes — JWT required
app.use(authMiddleware);
app.use('/api/accounts', accountsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/pending', pendingRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/income', incomeRouter);
app.use('/api/recurring', recurringRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`Backend démarré sur le port ${PORT}`);
});
