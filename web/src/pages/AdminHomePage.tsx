import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { addDays, format, parseISO, startOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { appointmentsApi, clientsApi } from '../api';
import { Appuntamento, Cliente } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import { useAuth } from '../hooks/useAuth';

const today = format(new Date(), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function AdminHomePage() {
  const { user } = useAuth();

  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ['appointments', 'today', today],
    queryFn: () => appointmentsApi.list({ from: today, to: tomorrow, limit: '200' }),
  });

  const { data: noShowData } = useQuery({
    queryKey: ['appointments', 'noshow-month', monthStart],
    queryFn: () => appointmentsApi.list({ from: monthStart, to: tomorrow, stato: 'noshow', limit: '500' }),
  });

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['clients', 'recent-home'],
    queryFn: () => clientsApi.list({ sort: 'recenti', limit: '5' }),
  });

  const todayAppointments: Appuntamento[] = useMemo(
    () => (todayData?.items ?? []).filter((appointment: Appuntamento) => appointment.stato !== 'cancelled'),
    [todayData]
  );
  const recentClients: Cliente[] = clientsData?.items ?? [];

  const stats = useMemo(() => {
    const confirmed = todayAppointments.filter((appointment) => appointment.stato === 'confirmed').length;
    const estimatedRevenue = todayAppointments
      .filter((appointment) => appointment.stato === 'confirmed' || appointment.stato === 'done')
      .reduce((sum, appointment) => sum + appointment.importo, 0);
    const noShowsThisMonth = noShowData?.items?.length ?? 0;

    return {
      total: todayAppointments.length,
      confirmed,
      estimatedRevenue,
      noShowsThisMonth,
    };
  }, [todayAppointments, noShowData]);

  const sortedAppointments = useMemo(
    () => [...todayAppointments].sort((a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime()),
    [todayAppointments]
  );

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            {greeting()}
            {user?.email ? `, ${user.email.split('@')[0]}` : ''}.
          </h1>
          <p className="mt-1 text-sm text-slate-500">Panoramica rapida della giornata e dei clienti piu recenti.</p>
        </div>
        <span className="text-sm font-medium text-slate-500">
          {capitalize(format(new Date(), 'EEEE d MMMM yyyy', { locale: it }))}
        </span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="kpi-card">
          <p className="mb-2 text-xs font-medium text-slate-500">Appuntamenti oggi</p>
          <p className="text-3xl font-bold text-slate-950">{loadingToday ? '–' : stats.total}</p>
          <p className="mt-1 text-xs font-medium text-brand-600">totali</p>
        </div>
        <div className="kpi-card">
          <p className="mb-2 text-xs font-medium text-slate-500">Confermati</p>
          <p className="text-3xl font-bold text-emerald-700">{loadingToday ? '–' : stats.confirmed}</p>
          <p className="mt-1 text-xs font-medium text-emerald-600">da gestire oggi</p>
        </div>
        <div className="kpi-card">
          <p className="mb-2 text-xs font-medium text-slate-500">Incasso previsto</p>
          <p className="text-3xl font-bold text-amber-700">{loadingToday ? '–' : `EUR ${stats.estimatedRevenue}`}</p>
          <p className="mt-1 text-xs font-medium text-amber-600">giornaliero</p>
        </div>
        <div className="kpi-card">
          <p className="mb-2 text-xs font-medium text-slate-500">No-show del mese</p>
          <p className="text-3xl font-bold text-rose-600">{stats.noShowsThisMonth}</p>
          <p className="mt-1 text-xs font-medium text-rose-500">appuntamenti persi</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">Agenda di oggi</h2>
            <Link to="/admin/agenda" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Apri completa →
            </Link>
          </div>

          {loadingToday ? (
            <p className="py-4 text-sm text-slate-400">Caricamento...</p>
          ) : sortedAppointments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-8 text-center">
              <p className="text-sm text-slate-400">Nessun appuntamento oggi.</p>
              <Link to="/admin/agenda" className="btn-primary mt-3 inline-flex text-sm">
                + Nuovo appuntamento
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition-colors hover:border-slate-200"
                >
                  <div className="flex-shrink-0 rounded-lg bg-brand-100 px-2 py-1 text-xs font-bold tabular-nums text-brand-700">
                    {format(parseISO(appointment.inizio), 'HH:mm')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{appointment.cliente?.nome ?? '—'}</p>
                    <p className="truncate text-xs text-slate-400">
                      {appointment.servizio?.nome ?? '—'} · {appointment.staff?.nome ?? '—'}
                    </p>
                  </div>
                  <StatusBadge stato={appointment.stato} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">Clienti recenti</h2>
            <Link to="/admin/clients" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Vedi tutti →
            </Link>
          </div>

          {loadingClients ? (
            <p className="py-4 text-sm text-slate-400">Caricamento...</p>
          ) : recentClients.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-8 text-center">
              <p className="text-sm text-slate-400">Nessun cliente ancora.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <Link
                  key={client.id}
                  to={`/admin/clients/${client.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {client.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{client.nome}</p>
                    <p className="text-xs text-slate-400">
                      {client.visiteTotali} visite · EUR {client.valoreTotale.toFixed(0)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
