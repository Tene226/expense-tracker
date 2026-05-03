import { useState, useEffect, useCallback } from 'react';
import { getPending, pasteSMS, confirmPending, rejectPending } from '../lib/api';

export function usePending() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPending();
      setPending(data);
    } catch {
      // silently fail — UI still functional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const submitPaste = useCallback(async (smsText) => {
    const result = await pasteSMS(smsText);
    await refresh();
    return result;
  }, [refresh]);

  const confirm = useCallback(async (id, data, onRefreshExpenses) => {
    await confirmPending(id, data);
    await refresh();
    if (onRefreshExpenses) await onRefreshExpenses();
  }, [refresh]);

  const reject = useCallback(async (id) => {
    await rejectPending(id);
    await refresh();
  }, [refresh]);

  return { pending, loading, refresh, submitPaste, confirm, reject };
}
