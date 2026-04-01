import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '../api';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import StatusBadge from '../components/shared/StatusBadge';
import { Appuntamento } from '../types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id!),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['client-stats', id],
    queryFn: () => clientsApi.stats(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-gray-400">Caricamento...</div>;
  if (!cliente) return <div className="p-6 text-gray-500">Cliente non trovato</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/clients" className="text-gray-400 hover:text-gray-600 text-sm">← Clienti</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl">
              {cliente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{cliente.nome}</h2>
              {cliente.tag.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {cliente.tag.map((t: string) => (
                    <span key={t} className="badge bg-brand-100 text-brand-700">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {cliente.telefono && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>📞</span> {cliente.telefono}
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>✉️</span> {cliente.email}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <span>📅</span> Cliente dal {format(parseISO(cliente.createdAt), 'd MMM yyyy', { locale: it })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Visite totali', value: cliente.visiteTotali, suffix: '' },
            { label: 'Valore totale', value: `€${cliente.valoreTotale.toFixed(0)}`, suffix: '' },
            { label: 'No-show', value: stats?.noshowCount ?? 0, suffix: '' },
            { label: 'Ultima visita', value: cliente.ultimaVisita ? format(parseISO(cliente.ultimaVisita), 'd MMM', { locale: it }) : '—', suffix: '' },
          ].map((s) => (
            <div key={s.label} className="card text-center py-4">
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Monthly frequency chart */}
        {stats?.frequenzaMensile && (
          <div className="card lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Frequenza mensile (12 mesi)</h3>
            <div className="flex items-end gap-1 h-24">
              {stats.frequenzaMensile.map((m: { mese: string; visite: number }) => {
                const max = Math.max(...stats.frequenzaMensile.map((x: { visite: number }) => x.visite), 1);
                const pct = (m.visite / max) * 100;
                return (
                  <div key={m.mese} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-brand-100 rounded-t" style={{ height: `${Math.max(pct, 4)}%` }}>
                      <div className="w-full bg-brand-500 rounded-t h-full opacity-80" />
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap" style={{ fontSize: '9px' }}>
                      {m.mese.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Appointment history */}
        <div className="card lg:col-span-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Storico appuntamenti</h3>
          <div className="space-y-2">
            {(cliente.appuntamenti ?? []).map((app: Appuntamento) => (
              <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500 min-w-24">
                    {format(parseISO(app.inizio), 'd MMM yyyy', { locale: it })}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{app.servizio?.nome}</div>
                  <div className="text-xs text-gray-400">con {app.staff?.nome}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">€{app.importo}</span>
                  <StatusBadge stato={app.stato} />
                </div>
              </div>
            ))}
            {(cliente.appuntamenti ?? []).length === 0 && (
              <div className="text-gray-400 text-sm text-center py-4">Nessun appuntamento</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
