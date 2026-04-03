import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, addDays, startOfMonth, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { appointmentsApi, clientsApi } from '../api';
import { Appuntamento, Cliente } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import { useAuth } from '../hooks/useAuth';

const today = format(new Date(), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AdminHomePage() {
  const { user } = useAuth();

  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ['appointments', 'today', today],
    queryFn: () => appointmentsApi.list({ from: today, to: tomorrow, limit: '200' }),
  });

  const { data: noshowData } = useQuery({
    queryKey: ['appointments', 'noshow-month', monthStart],
    queryFn: () => appointmentsApi.list({ from: monthStart, to: tomorrow, stato: 'noshow', limit: '500' }),
  });

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['clients', 'recenti-home'],
    queryFn: () => clientsApi.list({ sort: 'recenti', limit: '5' }),
  });

  const todayApps: Appuntamento[] = useMemo(
    () => (todayData?.items ?? []).filter((a: Appuntamento) => a.stato !== 'cancelled'),
    [todayData]
  );
  const recentClients: Cliente[] = clientsData?.items ?? [];

  const kpis = useMemo(() => {
    const confermati = todayApps.filter((a) => a.stato === 'confirmed').length;
    const incasso = todayApps
      .filter((a) => a.stato === 'confirmed' || a.stato === 'done')
      .reduce((sum, a) => sum + a.importo, 0);
    const noshowMese = noshowData?.items?.length ?? 0;
    return { total: todayApps.length, confermati, incasso, noshowMese };
  }, [todayApps, noshowData]);

  const sortedApps = useMemo(
    () => [...todayApps].sort((a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime()),
    [todayApps]
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 mb-1">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {greeting()}{user?.email ? `, ${user.email.split('@')[0]}` : ''}.
          </h1>
        </div>
        <span className="text-sm font-medium text-slate-500">
          {capitalize(format(new Date(), 'EEEE d MMMM yyyy', { locale: it }))}
        </span>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 mb-2">Appuntamenti oggi</p>
          <p className="text-3xl font-bold text-slate-950">
            {loadingToday ? '–' : kpis.total}
          </p>
          <p className="text-xs text-brand-600 mt-1 font-medium">totali</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 mb-2">Confermati</p>
          <p className="text-3xl font-bold text-emerald-700">
            {loadingToday ? '–' : kpis.confermati}
          </p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">da evadere</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 mb-2">Incasso previsto</p>
          <p className="text-3xl font-bold text-amber-700">
            {loadingToday ? '–' : `€ ${kpis.incasso.toFixed(0)}`}
          </p>
          <p className="text-xs text-amber-600 mt-1 font-medium">oggi</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 mb-2">No-show (mese)</p>
          <p className="text-3xl font-bold text-red-600">
            {kpis.noshowMese}
          </p>
          <p className="text-xs text-red-500 mt-1 font-medium">appuntamenti persi</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Today's agenda */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-950">Agenda di oggi</h2>
            <Link to="/admin/agenda" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Apri completa →
            </Link>
          </div>

          {loadingToday ? (
            <p className="text-sm text-slate-400 py-4">Caricamento...</p>
          ) : sortedApps.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-8 text-center">
              <p className="text-sm text-slate-400">Nessun appuntamento oggi.</p>
              <Link to="/admin/agenda" className="btn-primary mt-3 inline-flex text-sm">
                + Nuovo appuntamento
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedApps.map((app) => (
                <div key={app.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-slate-200 transition-colors">
                  <div className="flex-shrink-0 rounded-lg bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700 tabular-nums">
                    {format(parseISO(app.inizio), 'HH:mm')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{app.cliente?.nome ?? '—'}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {app.servizio?.nome ?? '—'} · {app.staff?.nome ?? '—'}
                    </p>
                  </div>
                  <StatusBadge stato={app.stato} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent clients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-950">Clienti recenti</h2>
            <Link to="/admin/clients" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Vedi tutti →
            </Link>
          </div>

          {loadingClients ? (
            <p className="text-sm text-slate-400 py-4">Caricamento...</p>
          ) : recentClients.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-8 text-center">
              <p className="text-sm text-slate-400">Nessun cliente ancora.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClients.map((c) => (
                <Link
                  key={c.id}
                  to={`/admin/clients/${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.nome}</p>
                    <p className="text-xs text-slate-400">{c.visiteTotali} visite · €{c.valoreTotale.toFixed(0)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
