import { useState } from 'react';
import { CATEGORIES } from './AddExpense';

const PROVIDER_LABELS = {
  orange_money: 'Orange Money',
  wave: 'Wave',
  moov: 'Moov',
  coris: 'Coris',
  unknown: '',
};

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export default function PendingCard({ item, onConfirm, onReject, accounts = [] }) {
  const [category, setCategory]   = useState('autres');
  const [note, setNote]           = useState(item.parsed_note || '');
  const [accountId, setAccountId] = useState(
    item.account_id ? String(item.account_id) : (accounts.length === 1 ? String(accounts[0].id) : '')
  );
  const [loading, setLoading]     = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(item.id, {
        category,
        note,
        account_id: accountId ? Number(accountId) : null,
      });
    }
    finally { setLoading(false); }
  }

  async function handleReject() {
    if (!window.confirm('Rejeter cette dépense ?')) return;
    await onReject(item.id);
  }

  const provider = PROVIDER_LABELS[item.provider];

  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      {/* Amber header */}
      <div className="bg-amber-400 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(120,53,15,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-xs font-semibold text-amber-900">
            En attente{provider ? ` · ${provider}` : ''}
          </p>
        </div>
        <p className="text-[11px] text-amber-700/70">{relativeTime(item.created_at)}</p>
      </div>

      {/* Body */}
      <div className="bg-white px-4 pt-4 pb-4 flex flex-col gap-3.5">
        <div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[#0A0A0A] leading-none">
            {item.amount.toLocaleString('fr-FR')}
            <span className="text-base font-semibold text-zinc-400 ml-2">FCFA</span>
          </p>
          {item.parsed_note && (
            <p className="text-sm text-zinc-500 mt-1.5">{item.parsed_note}</p>
          )}
        </div>

        <div>
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">Catégorie</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 bg-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] cursor-pointer"
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">Description</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="ex: marché, essence..."
            className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 bg-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] placeholder:text-zinc-300"
          />
        </div>

        {accounts.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">
              Compte débité
              {item.remaining_balance != null && (
                <span className="ml-1 text-emerald-600 normal-case font-medium">· solde SMS détecté</span>
              )}
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 bg-white text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] cursor-pointer"
            >
              <option value="">— Aucun compte —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.balance.toLocaleString('fr-FR')} FCFA
                </option>
              ))}
            </select>
            {item.remaining_balance != null && accountId && (
              <p className="text-[10px] text-emerald-600 mt-1 px-1">
                Solde après confirmation : {item.remaining_balance.toLocaleString('fr-FR')} FCFA (depuis SMS)
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-0.5">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 min-h-[46px] bg-[#0A0A0A] text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Confirmer
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 min-h-[46px] bg-zinc-50 text-zinc-600 border border-zinc-200 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all duration-150 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Rejeter
          </button>
        </div>
      </div>
    </div>
  );
}
