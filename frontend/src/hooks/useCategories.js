import { useState, useEffect } from 'react';
import { getCategories, createCategory, deleteCategory } from '../lib/api';

export const DEFAULT_CATEGORIES = [
  { id: 'alimentation', label: 'Alimentation', color: '#1D9E75', custom: false },
  { id: 'transport',    label: 'Transport',    color: '#378ADD', custom: false },
  { id: 'sortie',       label: 'Sortie',       color: '#D4537E', custom: false },
  { id: 'shopping',     label: 'Shopping',     color: '#D85A30', custom: false },
  { id: 'sante',        label: 'Santé',        color: '#3B6D11', custom: false },
  { id: 'factures',     label: 'Factures',     color: '#534AB7', custom: false },
  { id: 'autres',       label: 'Autres',       color: '#5F5E5A', custom: false },
];

export function useCategories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  async function refresh() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      // keep defaults on error
    }
  }

  useEffect(() => { refresh(); }, []);

  async function addCategory(body) {
    const cat = await createCategory(body);
    await refresh();
    return cat;
  }

  async function removeCategory(id) {
    await deleteCategory(id);
    await refresh();
  }

  return { categories, addCategory, removeCategory, refresh };
}
