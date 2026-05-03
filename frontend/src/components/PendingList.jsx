import PendingCard from './PendingCard';

export default function PendingList({ pending, onConfirm, onReject, accounts = [] }) {
  if (!pending.length) return null;

  return (
    <div className="flex flex-col gap-3 mb-5">
      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest">
        En attente · {pending.length}
      </p>
      {pending.map(item => (
        <PendingCard
          key={item.id}
          item={item}
          onConfirm={onConfirm}
          onReject={onReject}
          accounts={accounts}
        />
      ))}
    </div>
  );
}
