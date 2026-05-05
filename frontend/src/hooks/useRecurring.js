import { useState, useEffect } from 'react';
import { getRecurring, createRecurring, deleteRecurring, applyRecurring, unapplyRecurring } from '../lib/api';

export function useRecurring(month) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getRecurring(month);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [month]);

  async function addItem(body) {
    await createRecurring(body);
    await refresh();
  }

  async function removeItem(id) {
    await deleteRecurring(id);
    await refresh();
  }

  async function applyItem(id) {
    const result = await applyRecurring(id, { month });
    await refresh();
    return result;
  }

  async function unapplyItem(id, logId) {
    await unapplyRecurring(id, logId);
    await refresh();
  }

  return { items, loading, addItem, removeItem, applyItem, unapplyItem, refresh };
}
