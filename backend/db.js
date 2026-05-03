const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'expenses.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    type            TEXT    NOT NULL DEFAULT 'other',
    balance_initial REAL    NOT NULL DEFAULT 0,
    color           TEXT    NOT NULL DEFAULT '#5F5E5A',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    amount     REAL    NOT NULL,
    category   TEXT    NOT NULL,
    note       TEXT    DEFAULT '',
    date       TEXT    NOT NULL,
    account_id INTEGER REFERENCES accounts(id),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pending_expenses (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
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

// Migrate existing tables — silently skip if column already exists
try { db.exec('ALTER TABLE expenses ADD COLUMN account_id INTEGER REFERENCES accounts(id)'); } catch {}
try { db.exec('ALTER TABLE pending_expenses ADD COLUMN account_id INTEGER REFERENCES accounts(id)'); } catch {}
try { db.exec('ALTER TABLE pending_expenses ADD COLUMN remaining_balance REAL'); } catch {}

module.exports = db;
