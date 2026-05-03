import { useState } from 'react';
import PasteSMS from './PasteSMS';

export const CATEGORIES = [
  { id: 'alimentation', label: 'Alimentation', color: '#1D9E75' },
  { id: 'transport',    label: 'Transport',    color: '#378ADD' },
  { id: 'sortie',       label: 'Sortie',       color: '#D4537E' },
  { id: 'shopping',     label: 'Shopping',     color: '#D85A30' },
  { id: 'sante',        label: 'Santé',        color: '#3B6D11' },
  { id: 'factures',     label: 'Factures',     color: '#534AB7' },
  { id: 'autres',       label: 'Autres',       color: '#5F5E5A' },
];

export default function AddExpense({ onAdd, onSMSSuccess, accounts = [] }) {
  const [amount, setAmount]     = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || !category) { setError('Montant et catégorie requis'); return; }
    setSaving(true);
    setError('');
    try {
      await onAdd({
        amount: parseFloat(amount),
        category,
        note,
        date: new Date(date).toISOString(),
        account_id: accountId ? Number(accountId) : null,
      });
      setAmount('');
      setNote('');
      setCategory('');
      setDate(new Date().toISOString().slice(0, 10));
      setAccountId('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* Amount hero — tight top, big number */}
      <div className="px-5 pt-4 pb-4">
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Nouvelle dépense</p>
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="min-w-0 text-7xl font-bold text-[#0A0A0A] bg-transparent border-none outline-none placeholder:text-zinc-200 tabular-nums leading-none"
            style={{ width: `${Math.max((amount || '0').length, 1) + 0.3}ch` }}
          />
          <span className="text-sm font-semibold text-zinc-400">FCFA</span>
        </div>
        <div className="h-px bg-zinc-200 mt-3" />
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5">
        {/* Category */}
        <div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Catégorie</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.slice(0, 6).map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`min-h-[46px] rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 active:scale-[0.97] ${
                  category === cat.id
                    ? 'bg-[#0A0A0A] text-white shadow-lg'
                    : 'bg-white text-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.07)]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category === cat.id ? 'rgba(255,255,255,0.5)' : cat.color }}
                />
                {cat.label}
              </button>
            ))}
            {/* Autres — full width */}
            <button
              type="button"
              onClick={() => setCategory('autres')}
              className={`col-span-2 min-h-[46px] rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 active:scale-[0.97] ${
                category === 'autres'
                  ? 'bg-[#0A0A0A] text-white shadow-lg'
                  : 'bg-white text-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.07)]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: category === 'autres' ? 'rgba(255,255,255,0.5)' : '#5F5E5A' }}
              />
              Autres
            </button>
          </div>
        </div>

        {/* Note + Date side by side on wider, stacked on narrow */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Note</p>
            <input
              type="text"
              placeholder="ex: déjeuner au bureau"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[46px] placeholder:text-zinc-300"
            />
          </div>

          <div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Date</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[46px]"
            />
          </div>

          {accounts.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Compte débité</p>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full border border-zinc-200 rounded-2xl px-4 py-3 bg-white text-sm text-[#0A0A0A] min-h-[46px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] cursor-pointer"
              >
                <option value="">— Aucun compte —</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.balance.toLocaleString('fr-FR')} FCFA
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm font-medium -mt-1">{error}</p>
        )}

        {success && (
          <div className="bg-emerald-50 rounded-2xl px-4 py-3 flex items-center gap-2.5 -mt-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <p className="text-emerald-700 text-sm font-semibold">Dépense enregistrée</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] bg-[#0A0A0A] text-white rounded-2xl font-semibold text-base transition-all duration-150 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* SMS import */}
      <div className="px-5 pb-8">
        <PasteSMS onSuccess={onSMSSuccess} />
      </div>
    </form>
  );
}
