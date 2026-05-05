const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...options });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:logout'));
    throw new Error('Session expirée');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Auth
export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const register = (username, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });

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

// Categories
export const getCategories = () => request('/categories');

export const createCategory = (body) =>
  request('/categories', { method: 'POST', body: JSON.stringify(body) });

export const deleteCategory = (id) =>
  request(`/categories/${id}`, { method: 'DELETE' });

// Income
export const getIncome = (month) =>
  request(`/income${month ? `?month=${month}` : ''}`);

export const getIncomeSummary = (month) =>
  request(`/income/summary${month ? `?month=${month}` : ''}`);

export const createIncome = (body) =>
  request('/income', { method: 'POST', body: JSON.stringify(body) });

export const deleteIncome = (id) =>
  request(`/income/${id}`, { method: 'DELETE' });

// Recurring
export const getRecurring = (month) =>
  request(`/recurring${month ? `?month=${month}` : ''}`);

export const createRecurring = (body) =>
  request('/recurring', { method: 'POST', body: JSON.stringify(body) });

export const updateRecurring = (id, body) =>
  request(`/recurring/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteRecurring = (id) =>
  request(`/recurring/${id}`, { method: 'DELETE' });

export const applyRecurring = (id, body) =>
  request(`/recurring/${id}/apply`, { method: 'POST', body: JSON.stringify(body) });

export const unapplyRecurring = (id, logId) =>
  request(`/recurring/${id}/apply/${logId}`, { method: 'DELETE' });
