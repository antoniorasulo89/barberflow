import { StatoAppuntamento } from '../../types';

const config: Record<StatoAppuntamento, { label: string; cls: string }> = {
  pending: { label: 'In attesa', cls: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confermato', cls: 'bg-green-100 text-green-800' },
  done: { label: 'Completato', cls: 'bg-blue-100 text-blue-800' },
  noshow: { label: 'No-show', cls: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancellato', cls: 'bg-gray-100 text-gray-600' },
};

export default function StatusBadge({ stato }: { stato: StatoAppuntamento }) {
  const { label, cls } = config[stato] ?? config.pending;
  return <span className={`badge ${cls}`}>{label}</span>;
}
