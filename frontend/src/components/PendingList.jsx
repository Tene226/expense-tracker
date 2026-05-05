import PendingCard from './PendingCard';
import { LG } from '../styles/tokens';
import { SectionHeader } from './Glass';

export default function PendingList({ pending, onConfirm, onReject, accounts = [], categories }) {
  if (!pending.length) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <SectionHeader>{pending.length} en attente</SectionHeader>
      {pending.map(item => (
        <PendingCard
          key={item.id}
          item={item}
          onConfirm={onConfirm}
          onReject={onReject}
          accounts={accounts}
          categories={categories}
        />
      ))}
    </div>
  );
}
