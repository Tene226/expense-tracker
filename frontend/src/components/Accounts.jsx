import { useState } from 'react';

const ACCOUNT_TYPES = {
  bank:         { label: 'Bancaire',     icon: '🏦' },
  mobile_money: { label: 'Mobile Money', icon: '📱' },
  cash:         { label: 'Espèces',      icon: '💵' },
  other:        { label: 'Autre',        icon: '💳' },
};

const PRESET_COLORS = [
  '#1D9E75', '#378ADD', '#D4537E', '#D85A30',
  '#534AB7', '#F59E0B', '#0A0A0A', '#5F5E5A',
];

function fmt(n) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function fmtShort(n) {
  return n.toLocaleString('fr-FR');
}

// ── Account Form ────────────────────────────────────────────────────────────

function AccountForm({ initial, onSave, onCancel }) {
  const [name, setName]           = useState(initial?.name ?? '');
  const [type, setType]           = useState(initial?.type ?? 'other');
  const [balance, setBalance]     = useState(initial?.balance_initial ?? 0);
  const [color, setColor]         = useState(initial?.color ?? '#378ADD');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Nom requis'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), type, balance_initial: parseFloat(balance) || 0, color });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
      <div>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Nom du compte</p>
        <input
          type="text"
          placeholder="ex: Orange Money, CCP, Espèces..."
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[46px] placeholder:text-zinc-300"
          autoFocus
        />
      </div>

      <div>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Type</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ACCOUNT_TYPES).map(([id, { label, icon }]) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`min-h-[46px] rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 active:scale-[0.97] ${
                type === id
                  ? 'bg-[#0A0A0A] text-white shadow-lg'
                  : 'bg-white text-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.07)]'
              }`}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Solde actuel (FCFA)</p>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={balance}
          onChange={e => setBalance(e.target.value)}
          className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[46px] placeholder:text-zinc-300"
        />
        <p className="text-[10px] text-zinc-400 mt-1 px-1">Entrez le solde réel actuel — il sera conservé comme référence de départ.</p>
      </div>

      <div>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Couleur</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-all duration-150 cursor-pointer active:scale-90 ${
                color === c ? 'ring-2 ring-offset-2 ring-[#0A0A0A] scale-110' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 min-h-[50px] bg-[#0A0A0A] text-white rounded-2xl font-semibold text-sm disabled:opacity-40 cursor-pointer active:scale-[0.98] transition-all duration-150"
        >
          {saving ? 'Enregistrement...' : (initial ? 'Mettre à jour' : 'Créer le compte')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[50px] px-5 bg-zinc-100 text-zinc-600 rounded-2xl font-semibold text-sm cursor-pointer active:scale-[0.98] transition-all duration-150"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Transfer Form ───────────────────────────────────────────────────────────

function TransferForm({ accounts, onSave, onCancel }) {
  const [fromId, setFromId]   = useState(accounts[0]?.id ?? '');
  const [toId, setToId]       = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [amount, setAmount]   = useState('');
  const [note, setNote]       = useState('');
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Montant requis'); return; }
    if (String(fromId) === String(toId)) { setError('Comptes différents requis'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        from_account_id: Number(fromId),
        to_account_id:   Number(toId),
        amount:          parseFloat(amount),
        note,
        date:            new Date(date).toISOString(),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const selectClass = "w-full border border-zinc-200 rounded-xl px-3 py-2.5 bg-white text-sm min-h-[46px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
      <div>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Depuis</p>
        <select value={fromId} onChange={e => setFromId(e.target.value)} className={selectClass}>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} — {fmtShort(a.balance)} FCFA</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Vers</p>
        <select value={toId} onChange={e => setToId(e.target.value)} className={selectClass}>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} — {fmtShort(a.balance)} FCFA</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Montant (FCFA)</p>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-white rounded-2xl px-4 py-3 text-sm text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[46px] placeholder:text-zinc-300"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Note</p>
          <input
            type="text"
            placeholder="ex: recharge OM"
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
            className="bg-white rounded-2xl px-3 py-3 text-sm text-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[46px]"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 min-h-[50px] bg-[#0A0A0A] text-white rounded-2xl font-semibold text-sm disabled:opacity-40 cursor-pointer active:scale-[0.98] transition-all duration-150"
        >
          {saving ? 'Enregistrement...' : 'Valider le virement'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[50px] px-5 bg-zinc-100 text-zinc-600 rounded-2xl font-semibold text-sm cursor-pointer active:scale-[0.98] transition-all duration-150"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Account Card ────────────────────────────────────────────────────────────

function AccountCard({ account, onEdit, onDelete }) {
  const typeInfo = ACCOUNT_TYPES[account.type] || ACCOUNT_TYPES.other;
  const isNegative = account.balance < 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.07)] flex">
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: account.color }} />
      <div className="flex-1 px-4 py-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-bold text-[#0A0A0A] truncate">{account.name}</p>
            <span className="text-[10px] text-zinc-400 flex-shrink-0">{typeInfo.icon} {typeInfo.label}</span>
          </div>
          <p className={`text-lg font-bold tabular-nums leading-none ${isNegative ? 'text-red-500' : 'text-[#0A0A0A]'}`}>
            {fmtShort(account.balance)}
            <span className="text-xs font-semibold text-zinc-400 ml-1">FCFA</span>
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(account)}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            aria-label="Modifier"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => onDelete(account)}
            className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-red-400 transition-colors cursor-pointer"
            aria-label="Supprimer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function Accounts({ accounts, transfers, loading, onAdd, onEdit, onDelete, onAddTransfer, onDeleteTransfer }) {
  const [view, setView] = useState('list'); // 'list' | 'new-account' | 'edit-account' | 'new-transfer'
  const [editingAccount, setEditingAccount] = useState(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  async function handleAddAccount(data) {
    await onAdd(data);
    setView('list');
  }

  async function handleEditAccount(data) {
    await onEdit(editingAccount.id, data);
    setEditingAccount(null);
    setView('list');
  }

  async function handleDeleteAccount(account) {
    if (!window.confirm(`Supprimer le compte "${account.name}" ?`)) return;
    try {
      await onDelete(account.id);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleAddTransfer(data) {
    await onAddTransfer(data);
    setView('list');
  }

  function startEdit(account) {
    setEditingAccount(account);
    setView('edit-account');
  }

  if (loading && accounts.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'new-account') {
    return (
      <div className="flex flex-col">
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Nouveau compte</p>
          <p className="text-2xl font-bold text-[#0A0A0A]">Créer un compte</p>
        </div>
        <AccountForm onSave={handleAddAccount} onCancel={() => setView('list')} />
      </div>
    );
  }

  if (view === 'edit-account' && editingAccount) {
    return (
      <div className="flex flex-col">
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Modifier</p>
          <p className="text-2xl font-bold text-[#0A0A0A]">{editingAccount.name}</p>
        </div>
        <AccountForm initial={editingAccount} onSave={handleEditAccount} onCancel={() => setView('list')} />
      </div>
    );
  }

  if (view === 'new-transfer') {
    if (accounts.length < 2) {
      setView('list');
      return null;
    }
    return (
      <div className="flex flex-col">
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Virement</p>
          <p className="text-2xl font-bold text-[#0A0A0A]">Entre mes comptes</p>
        </div>
        <TransferForm accounts={accounts} onSave={handleAddTransfer} onCancel={() => setView('list')} />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Mes comptes</p>
        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-[11px] text-zinc-400 mb-0.5">Total</p>
            <p className={`text-3xl font-bold tabular-nums leading-none ${totalBalance < 0 ? 'text-red-500' : 'text-[#0A0A0A]'}`}>
              {fmtShort(totalBalance)}
              <span className="text-sm font-semibold text-zinc-400 ml-1.5">FCFA</span>
            </p>
          </div>
          <div className="flex gap-2">
            {accounts.length >= 2 && (
              <button
                onClick={() => setView('new-transfer')}
                className="min-h-[38px] px-4 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.97] transition-all duration-150 flex items-center gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
                Virement
              </button>
            )}
            <button
              onClick={() => setView('new-account')}
              className="min-h-[38px] px-4 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.97] transition-all duration-150 flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Nouveau
            </button>
          </div>
        </div>
      </div>

      {/* Account cards */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-5">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20"/>
            </svg>
          </div>
          <p className="text-zinc-400 text-sm font-medium text-center">Aucun compte</p>
          <p className="text-zinc-300 text-xs mt-1 text-center">Créez vos comptes bancaires, Mobile Money, etc.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 px-5">
          {accounts.map(a => (
            <AccountCard key={a.id} account={a} onEdit={startEdit} onDelete={handleDeleteAccount} />
          ))}
        </div>
      )}

      {/* Recent transfers */}
      {transfers.length > 0 && (
        <div className="px-5 mt-6">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Virements récents</p>
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            {transfers.slice(0, 10).map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== Math.min(transfers.length, 10) - 1 ? 'border-b border-zinc-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                    {t.from_name} → {t.to_name}
                  </p>
                  {t.note && <p className="text-[11px] text-zinc-400 truncate mt-0.5">{t.note}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-sm font-bold tabular-nums text-[#0A0A0A]">
                    {fmtShort(t.amount)}
                  </span>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Supprimer ce virement ?')) return;
                      await onDeleteTransfer(t.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-red-400 transition-colors cursor-pointer ml-1"
                    aria-label="Supprimer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
