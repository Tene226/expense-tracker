const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'expenses.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL DEFAULT 1 REFERENCES users(id),
    name            TEXT    NOT NULL,
    type            TEXT    NOT NULL DEFAULT 'other',
    balance_initial REAL    NOT NULL DEFAULT 0,
    color           TEXT    NOT NULL DEFAULT '#5F5E5A',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL DEFAULT 1 REFERENCES users(id),
    amount     REAL    NOT NULL,
    category   TEXT    NOT NULL,
    note       TEXT    DEFAULT '',
    date       TEXT    NOT NULL,
    account_id INTEGER REFERENCES accounts(id),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pending_expenses (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL DEFAULT 1 REFERENCES users(id),
    amount        REAL    NOT NULL,
    raw_sms       TEXT    NOT NULL,
    parsed_note   TEXT    DEFAULT '',
    provider      TEXT    DEFAULT 'unknown',
    source        TEXT    DEFAULT 'webhook',
    account_id    INTEGER REFERENCES accounts(id),
    date          TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account_id INTEGER NOT NULL REFERENCES accounts(id),
    to_account_id   INTEGER NOT NULL REFERENCES accounts(id),
    amount          REAL    NOT NULL,
    note            TEXT    DEFAULT '',
    date            TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrations — silently skip if column already exists
try { db.exec('ALTER TABLE expenses ADD COLUMN account_id INTEGER REFERENCES accounts(id)'); } catch {}
try { db.exec('ALTER TABLE expenses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1'); } catch {}
try { db.exec('ALTER TABLE pending_expenses ADD COLUMN account_id INTEGER REFERENCES accounts(id)'); } catch {}
try { db.exec('ALTER TABLE pending_expenses ADD COLUMN remaining_balance REAL'); } catch {}
try { db.exec('ALTER TABLE pending_expenses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1'); } catch {}
try { db.exec('ALTER TABLE accounts ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1'); } catch {}

// New tables
db.exec(`
  CREATE TABLE IF NOT EXISTS custom_categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    label      TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#5F5E5A',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS income (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    amount     REAL    NOT NULL,
    source     TEXT    NOT NULL DEFAULT '',
    note       TEXT    DEFAULT '',
    date       TEXT    NOT NULL,
    account_id INTEGER REFERENCES accounts(id),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recurring_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    name         TEXT    NOT NULL,
    amount       REAL    NOT NULL,
    type         TEXT    NOT NULL DEFAULT 'expense',
    category     TEXT    DEFAULT 'autres',
    account_id   INTEGER REFERENCES accounts(id),
    day_of_month INTEGER NOT NULL DEFAULT 1,
    active       INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recurring_logs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL REFERENCES users(id),
    recurring_item_id INTEGER NOT NULL REFERENCES recurring_items(id),
    month             TEXT    NOT NULL,
    expense_id        INTEGER REFERENCES expenses(id),
    income_id         INTEGER REFERENCES income(id),
    created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
