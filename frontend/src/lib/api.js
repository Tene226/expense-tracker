const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Expenses
export const getExpenses = (month) =>
  request(`/expenses${month ? `?month=${month}` : ''}`);

export const getSummary = (month) =>
  request(`/expenses/summary${month ? `?month=${month}` : ''}`);

export const createExpense = (body) =>
  request('/expenses', { method: 'POST', body: JSON.stringify(body) });

export const deleteExpense = (id) =>
  request(`/expenses/${id}`, { method: 'DELETE' });

// Pending
export const getPending = () => request('/pending');

export const pasteSMS = (sms_text, date) =>
  request('/pending/paste', { method: 'POST', body: JSON.stringify({ sms_text, date }) });

export const confirmPending = (id, body) =>
  request(`/pending/${id}/confirm`, { method: 'POST', body: JSON.stringify(body) });

export const rejectPending = (id) =>
  request(`/pending/${id}`, { method: 'DELETE' });

// Accounts
export const getAccounts = () => request('/accounts');

export const createAccount = (body) =>
  request('/accounts', { method: 'POST', body: JSON.stringify(body) });

export const updateAccount = (id, body) =>
  request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteAccount = (id) =>
  request(`/accounts/${id}`, { method: 'DELETE' });

// Transfers
export const getTransfers = () => request('/accounts/transfers');

export const createTransfer = (body) =>
  request('/accounts/transfers', { method: 'POST', body: JSON.stringify(body) });

export const deleteTransfer = (id) =>
  request(`/accounts/transfers/${id}`, { method: 'DELETE' });
