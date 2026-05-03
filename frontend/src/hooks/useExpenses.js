import { useState, useEffect, useCallback } from 'react';
import { getExpenses, getSummary, createExpense, deleteExpense } from '../lib/api';

export function useExpenses(month) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exp, sum] = await Promise.all([getExpenses(month), getSummary(month)]);
      setExpenses(exp);
      setSummary(sum);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { refresh(); }, [refresh]);

  const addExpense = useCallback(async (data) => {
    await createExpense(data);
    await refresh();
  }, [refresh]);

  const removeExpense = useCallback(async (id) => {
    await deleteExpense(id);
    await refresh();
  }, [refresh]);

  return { expenses, summary, loading, error, refresh, addExpense, removeExpense };
}
