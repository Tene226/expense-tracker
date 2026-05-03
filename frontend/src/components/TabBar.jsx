function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M2 10h20"/>
      <circle cx="16" cy="15" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

export default function TabBar({ active, onChange, pendingCount }) {
  const tabs = [
    { id: 'add',      label: 'Ajouter',   Icon: PlusIcon },
    { id: 'accounts', label: 'Comptes',   Icon: WalletIcon },
    { id: 'history',  label: 'Historique', Icon: ListIcon },
    { id: 'summary',  label: 'Résumé',    Icon: ChartIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-zinc-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] cursor-pointer transition-colors duration-150 relative ${
              active === id ? 'text-[#0A0A0A]' : 'text-zinc-400'
            }`}
          >
            <Icon />
            <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-150 ${
              active === id ? 'text-[#0A0A0A]' : 'text-zinc-400'
            }`}>{label}</span>
            {id === 'history' && pendingCount > 0 && (
              <span className="absolute top-2.5 left-[calc(50%+6px)] bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1 leading-none">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
