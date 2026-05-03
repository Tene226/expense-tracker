import { useState, useEffect, useCallback } from 'react';
import {
  getAccounts, createAccount, updateAccount, deleteAccount,
  getTransfers, createTransfer, deleteTransfer,
} from '../lib/api';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accs, trfs] = await Promise.all([getAccounts(), getTransfers()]);
      setAccounts(accs);
      setTransfers(trfs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addAccount = useCallback(async (data) => {
    const created = await createAccount(data);
    await refresh();
    return created;
  }, [refresh]);

  const editAccount = useCallback(async (id, data) => {
    const updated = await updateAccount(id, data);
    await refresh();
    return updated;
  }, [refresh]);

  const removeAccount = useCallback(async (id) => {
    await deleteAccount(id);
    await refresh();
  }, [refresh]);

  const addTransfer = useCallback(async (data) => {
    const created = await createTransfer(data);
    await refresh();
    return created;
  }, [refresh]);

  const removeTransfer = useCallback(async (id) => {
    await deleteTransfer(id);
    await refresh();
  }, [refresh]);

  return {
    accounts, transfers, loading, error,
    refresh, addAccount, editAccount, removeAccount,
    addTransfer, removeTransfer,
  };
}
