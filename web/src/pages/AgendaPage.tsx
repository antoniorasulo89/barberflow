import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format, addDays, subDays, parseISO,
  startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth,
  addWeeks, subWeeks, addMonths, subMonths,
  isSameDay, isToday,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { appointmentsApi, staffApi } from '../api';
import { Appuntamento, Staff, StatoAppuntamento } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import NewAppointmentModal from '../components/dashboard/NewAppointmentModal';

type ViewMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

const APP_COLORS: Record<string, { bg: string; border: string }> = {
  confirmed: { bg: '#d1fae5', border: '#10b981' },
  done:      { bg: '#dbeafe', border: '#3b82f6' },
  noshow:    { bg: '#fee2e2', border: '#ef4444' },
  cancelled: { bg: '#f3f4f6', border: '#9ca3af' },
  pending:   { bg: '#fef3c7', border: '#f59e0b' },
};

const VIEW_LABELS: Record<ViewMode, string> = { day: 'Giorno', week: 'Settimana', month: 'Mese' };

export default function AgendaPage() {
  const [view, setView] = useState<ViewMode>('day');
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<Appuntamento | null>(null);
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const dateStr = format(date, 'yyyy-MM-dd');

  // Compute date range for current view
  const { rangeFrom, rangeTo } = useMemo(() => {
    if (view === 'day') {
      return { rangeFrom: dateStr, rangeTo: format(addDays(date, 1), 'yyyy-MM-dd') };
    }
    if (view === 'week') {
      const ws = startOfWeek(date, { weekStartsOn: 1 });
      const we = addDays(endOfWeek(date, { weekStartsOn: 1 }), 1);
      return { rangeFrom: format(ws, 'yyyy-MM-dd'), rangeTo: format(we, 'yyyy-MM-dd') };
    }
    const ms = startOfMonth(date);
    const me = addDays(endOfMonth(date), 1);
    return { rangeFrom: format(ms, 'yyyy-MM-dd'), rangeTo: format(me, 'yyyy-MM-dd') };
  }, [view, date, dateStr]);

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: staffApi.list,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', rangeFrom, rangeTo],
    queryFn: () => appointmentsApi.list({ from: rangeFrom, to: rangeTo, limit: '500' }),
  });

  const appointments: Appuntamento[] = data?.items ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, stato }: { id: string; stato: StatoAppuntamento }) =>
      appointmentsApi.update(id, { stato }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setSelected(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setSelected(null); },
  });

  function navigate(dir: 1 | -1) {
    if (view === 'day') setDate((d) => dir === 1 ? addDays(d, 1) : subDays(d, 1));
    else if (view === 'week') setDate((d) => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setDate((d) => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  }

  function headerTitle() {
    if (view === 'day') return format(date, 'EEEE d MMMM yyyy', { locale: it });
    if (view === 'week') {
      const ws = startOfWeek(date, { weekStartsOn: 1 });
      const we = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(ws, 'd MMM', { locale: it })} – ${format(we, 'd MMM yyyy', { locale: it })}`;
    }
    return format(date, 'MMMM yyyy', { locale: it });
  }

  function appStyle(app: Appuntamento) {
    const start = parseISO(app.inizio);
    const end = parseISO(app.fine);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    const baseMin = 8 * 60;
    const totalMin = 11 * 60;
    return {
      top: `${((startMin - baseMin) / totalMin) * 100}%`,
      height: `${Math.max(((endMin - startMin) / totalMin) * 100, 3)}%`,
    };
  }

  function exportPDF() {
    const doc = new jsPDF();
    const title = `Agenda – ${headerTitle()}`;
    doc.setFontSize(14);
    doc.text(title.charAt(0).toUpperCase() + title.slice(1), 14, 16);
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime()
    );
    autoTable(doc, {
      startY: 25,
      head: [['Data', 'Orario', 'Cliente', 'Servizio', 'Barbiere', 'Stato', 'Importo']],
      body: sorted.map((app) => [
        format(parseISO(app.inizio), 'd MMM yyyy', { locale: it }),
        `${format(parseISO(app.inizio), 'HH:mm')} – ${format(parseISO(app.fine), 'HH:mm')}`,
        app.cliente?.nome ?? '',
        app.servizio?.nome ?? '',
        app.staff?.nome ?? '',
        app.stato,
        `€${app.importo}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [107, 70, 193] },
    });
    doc.save(`agenda-${rangeFrom}.pdf`);
  }

  // ── Time grid column (shared between day & week) ──────────────────────────
  function TimeColumn() {
    return (
      <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-white sticky left-0 z-10">
        <div className="h-12 border-b border-gray-200" />
        <div className="relative" style={{ height: '660px' }}>
          {HOURS.map((h) => (
            <div key={h} className="absolute w-full text-xs text-gray-400 text-right pr-2"
              style={{ top: `${((h - 8) / 11) * 100}%` }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>
      </div>
    );
  }

  function AppCard({ app, compact = false }: { app: Appuntamento; compact?: boolean }) {
    const colors = APP_COLORS[app.stato] ?? APP_COLORS.pending;
    return (
      <button
        onClick={() => setSelected(app)}
        className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-left hover:opacity-90 transition-opacity overflow-hidden"
        style={{ ...appStyle(app), backgroundColor: colors.bg, borderLeft: `2px solid ${colors.border}`, fontSize: compact ? '10px' : '11px' }}
      >
        <div className="font-semibold truncate leading-tight">{app.cliente?.nome}</div>
        {!compact && <div className="text-gray-600 truncate leading-tight">{app.servizio?.nome}</div>}
        <div className="text-gray-500 leading-tight">
          {format(parseISO(app.inizio), 'HH:mm')}{!compact && ` – ${format(parseISO(app.fine), 'HH:mm')}`}
        </div>
      </button>
    );
  }

  // ── Day View ──────────────────────────────────────────────────────────────
  function DayView() {
    return (
      <div className="flex min-w-max">
        <TimeColumn />
        {staffList.map((staff) => (
          <div key={staff.id} className="flex-1 min-w-48 border-r border-gray-200">
            <div className="h-12 border-b border-gray-200 px-3 flex items-center bg-white sticky top-0 z-10">
              <div>
                <div className="text-sm font-semibold text-gray-900">{staff.nome}</div>
                <div className="text-xs text-gray-400">{staff.ruolo}</div>
              </div>
            </div>
            <div className="relative bg-gray-50" style={{ height: '660px' }}>
              {HOURS.map((h) => <div key={h} className="absolute w-full border-t border-gray-100" style={{ top: `${((h - 8) / 11) * 100}%` }} />)}
              {appointments.filter((a) => a.staffId === staff.id).map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Week View ─────────────────────────────────────────────────────────────
  function WeekView() {
    const weekDays = eachDayOfInterval({
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    });
    return (
      <div className="flex min-w-max">
        <TimeColumn />
        {weekDays.map((day) => {
          const dayApps = appointments.filter((a) => isSameDay(parseISO(a.inizio), day));
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className="flex-1 min-w-32 border-r border-gray-200">
              <div className={`h-12 border-b border-gray-200 px-2 flex flex-col justify-center sticky top-0 z-10 ${today ? 'bg-brand-50' : 'bg-white'}`}>
                <div className={`text-xs font-medium uppercase ${today ? 'text-brand-600' : 'text-gray-400'}`}>
                  {format(day, 'EEE', { locale: it })}
                </div>
                <div className={`text-sm font-bold ${today ? 'text-brand-600' : 'text-gray-900'}`}>
                  {format(day, 'd MMM', { locale: it })}
                </div>
              </div>
              <div className="relative bg-gray-50" style={{ height: '660px' }}>
                {HOURS.map((h) => <div key={h} className="absolute w-full border-t border-gray-100" style={{ top: `${((h - 8) / 11) * 100}%` }} />)}
                {dayApps.map((app) => <AppCard key={app.id} app={app} compact />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Month View ────────────────────────────────────────────────────────────
  function MonthView() {
    const calDays = eachDayOfInterval({
      start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
    });
    const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    return (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-xs font-medium text-gray-400 text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calDays.map((day) => {
            const dayApps = appointments.filter((a) => isSameDay(parseISO(a.inizio), day));
            const inMonth = day.getMonth() === date.getMonth();
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                onClick={() => { setDate(day); setView('day'); }}
                className={`min-h-20 p-1.5 rounded-lg border cursor-pointer transition-colors hover:border-brand-300 ${
                  today ? 'border-brand-400 bg-brand-50' : inMonth ? 'border-gray-100 bg-white' : 'border-gray-50 bg-gray-50'
                }`}
              >
                <div className={`text-xs font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                  today ? 'bg-brand-500 text-white' : inMonth ? 'text-gray-900' : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayApps.slice(0, 3).map((app) => {
                    const colors = APP_COLORS[app.stato] ?? APP_COLORS.pending;
                    return (
                      <div
                        key={app.id}
                        onClick={(e) => { e.stopPropagation(); setSelected(app); }}
                        className="truncate rounded px-1 cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: colors.bg, borderLeft: `2px solid ${colors.border}`, fontSize: '10px', lineHeight: '16px' }}
                      >
                        {format(parseISO(app.inizio), 'HH:mm')} {app.cliente?.nome}
                      </div>
                    );
                  })}
                  {dayApps.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">+{dayApps.length - 3} altri</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const statiActions: { stato: StatoAppuntamento; label: string }[] = [
    { stato: 'confirmed', label: 'Conferma' },
    { stato: 'done', label: 'Completato' },
    { stato: 'noshow', label: 'No-show' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
            {/* View switcher */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    view === v ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="btn-secondary px-2 py-1 text-sm">‹</button>
              <span className="text-sm font-medium text-gray-700 min-w-48 text-center capitalize">
                {headerTitle()}
              </span>
              <button onClick={() => navigate(1)} className="btn-secondary px-2 py-1 text-sm">›</button>
              <button onClick={() => setDate(new Date())} className="btn-secondary px-3 py-1 text-sm">Oggi</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPDF} className="btn-secondary text-sm">
              📄 Esporta PDF
            </button>
            <button onClick={() => setShowNew(true)} className="btn-primary">
              + Nuovo appuntamento
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Caricamento...</div>
      ) : view === 'month' ? (
        <div className="flex-1 overflow-auto"><MonthView /></div>
      ) : (
        <div className="flex-1 overflow-auto">
          {view === 'day' ? <DayView /> : <WeekView />}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <Modal title="Dettaglio appuntamento" onClose={() => setSelected(null)} size="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selected.cliente?.nome}</h3>
              <StatusBadge stato={selected.stato} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-gray-500">Servizio</div><div className="font-medium">{selected.servizio?.nome}</div></div>
              <div><div className="text-gray-500">Barbiere</div><div className="font-medium">{selected.staff?.nome}</div></div>
              <div><div className="text-gray-500">Inizio</div><div className="font-medium">{format(parseISO(selected.inizio), 'HH:mm')}</div></div>
              <div><div className="text-gray-500">Fine</div><div className="font-medium">{format(parseISO(selected.fine), 'HH:mm')}</div></div>
              <div><div className="text-gray-500">Importo</div><div className="font-medium">€{selected.importo}</div></div>
              {selected.cliente?.telefono && (
                <div><div className="text-gray-500">Telefono</div><div className="font-medium">{selected.cliente.telefono}</div></div>
              )}
            </div>
            {selected.note && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <span className="font-medium">Note: </span>{selected.note}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {statiActions.filter((a) => a.stato !== selected.stato).map((action) => (
                <button key={action.stato} className="btn-secondary text-sm"
                  onClick={() => updateMutation.mutate({ id: selected.id, stato: action.stato })}
                  disabled={updateMutation.isPending}>
                  {action.label}
                </button>
              ))}
              <button className="btn-danger text-sm ml-auto"
                onClick={() => deleteMutation.mutate(selected.id)}
                disabled={deleteMutation.isPending}>
                Cancella
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showNew && <NewAppointmentModal onClose={() => setShowNew(false)} date={dateStr} />}
    </div>
  );
}
