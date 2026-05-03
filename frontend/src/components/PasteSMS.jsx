import { useState } from 'react';
import { pasteSMS } from '../lib/api';

const PROVIDER_LABELS = {
  orange_money: 'Orange Money',
  wave: 'Wave',
  moov: 'Moov',
  coris: 'Coris',
  unknown: 'Inconnu',
};

function fmt(n) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function PasteSMS({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await pasteSMS(text.trim(), date);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setText('');
    setDate(new Date().toISOString().slice(0, 10));
    setResult(null);
    setError('');
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[52px] flex items-center justify-between px-4 py-3.5 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-[#0A0A0A]">Importer un SMS Mobile Money</span>
        </div>
        <svg
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A1A1AA"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-zinc-50">
          <textarea
            rows={4}
            placeholder={"Collez ici le SMS reçu...\n\nex: Paiement de 2 500 F chez Total."}
            value={text}
            onChange={e => { setText(e.target.value); setResult(null); setError(''); }}
            className="w-full mt-3 border border-zinc-200 rounded-xl px-3 py-3 text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] resize-none placeholder:text-zinc-300"
          />

          {!result && (
            <>
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Date de la dépense</p>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] min-h-[44px]"
                />
              </div>
              <button
                type="button"
                onClick={analyze}
                disabled={loading || !text.trim()}
                className="w-full min-h-[44px] bg-[#0A0A0A] text-white rounded-xl text-sm font-semibold disabled:opacity-30 transition-opacity duration-150 cursor-pointer"
              >
                {loading ? 'Analyse en cours...' : 'Analyser le SMS'}
              </button>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 font-medium">Aucune dépense détectable dans ce SMS</p>
              <button onClick={reset} className="text-xs text-red-400 mt-1 underline cursor-pointer">Réessayer</button>
            </div>
          )}

          {result && result.success && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <p className="text-sm font-semibold text-emerald-800">Dépense en attente créée</p>
              </div>
              <p className="text-sm text-emerald-700">
                <span className="font-bold tabular-nums">{fmt(result.amount)}</span>
                {result.note && <span className="text-emerald-600"> · {result.note}</span>}
              </p>
              {result.provider && result.provider !== 'unknown' && (
                <p className="text-xs text-emerald-500 mt-1">{PROVIDER_LABELS[result.provider] || result.provider}</p>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { if (onSuccess) onSuccess(); }}
                  className="text-xs font-semibold text-white bg-emerald-600 rounded-lg px-3 py-1.5 cursor-pointer"
                >
                  Voir dans Historique →
                </button>
                <button onClick={reset} className="text-xs text-emerald-600 underline cursor-pointer">Analyser un autre SMS</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
