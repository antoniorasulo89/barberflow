import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { appointmentsApi, staffApi } from '../api';
import { Appuntamento, Staff, StatoAppuntamento } from '../types';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import NewAppointmentModal from '../components/dashboard/NewAppointmentModal';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

export default function AgendaPage() {
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<Appuntamento | null>(null);
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const dateStr = format(date, 'yyyy-MM-dd');

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: staffApi.list,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', dateStr],
    queryFn: () => appointmentsApi.list({ data: dateStr, limit: '200' }),
  });

  const appointments: Appuntamento[] = data?.items ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, stato }: { id: string; stato: StatoAppuntamento }) =>
      appointmentsApi.update(id, { stato }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setSelected(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      setSelected(null);
    },
  });

  function getAppointmentsForStaff(staffId: string) {
    return appointments.filter((a) => a.staffId === staffId);
  }

  function appointmentStyle(app: Appuntamento) {
    const start = parseISO(app.inizio);
    const end = parseISO(app.fine);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    const baseMin = 8 * 60;
    const totalMin = 11 * 60;
    const top = ((startMin - baseMin) / totalMin) * 100;
    const height = ((endMin - startMin) / totalMin) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 3)}%` };
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setDate(subDays(date, 1))} className="btn-secondary px-2 py-1 text-sm">‹</button>
              <span className="text-sm font-medium text-gray-700 min-w-40 text-center">
                {format(date, 'EEEE d MMMM yyyy', { locale: it })}
              </span>
              <button onClick={() => setDate(addDays(date, 1))} className="btn-secondary px-2 py-1 text-sm">›</button>
              <button onClick={() => setDate(new Date())} className="btn-secondary px-3 py-1 text-sm">Oggi</button>
            </div>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary gap-2">
            + Nuovo appuntamento
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Caricamento...</div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-max">
            {/* Time column */}
            <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-white sticky left-0 z-10">
              <div className="h-12 border-b border-gray-200" />
              <div className="relative" style={{ height: '660px' }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full text-xs text-gray-400 text-right pr-2"
                    style={{ top: `${((h - 8) / 11) * 100}%` }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Staff columns */}
            {staffList.map((staff) => (
              <div key={staff.id} className="flex-1 min-w-48 border-r border-gray-200">
                <div className="h-12 border-b border-gray-200 px-3 flex items-center bg-white sticky top-0 z-10">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{staff.nome}</div>
                    <div className="text-xs text-gray-400">{staff.ruolo}</div>
                  </div>
                </div>
                <div className="relative bg-gray-50" style={{ height: '660px' }}>
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-gray-100"
                      style={{ top: `${((h - 8) / 11) * 100}%` }}
                    />
                  ))}

                  {/* Appointments */}
                  {getAppointmentsForStaff(staff.id).map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelected(app)}
                      className="absolute left-1 right-1 rounded-md px-2 py-1 text-left text-xs hover:opacity-90 transition-opacity overflow-hidden"
                      style={{
                        ...appointmentStyle(app),
                        backgroundColor:
                          app.stato === 'confirmed' ? '#d1fae5'
                          : app.stato === 'done' ? '#dbeafe'
                          : app.stato === 'noshow' ? '#fee2e2'
                          : app.stato === 'cancelled' ? '#f3f4f6'
                          : '#fef3c7',
                        borderLeft: `3px solid ${
                          app.stato === 'confirmed' ? '#10b981'
                          : app.stato === 'done' ? '#3b82f6'
                          : app.stato === 'noshow' ? '#ef4444'
                          : app.stato === 'cancelled' ? '#9ca3af'
                          : '#f59e0b'
                        }`,
                      }}
                    >
                      <div className="font-semibold truncate">{app.cliente?.nome}</div>
                      <div className="text-gray-600 truncate">{app.servizio?.nome}</div>
                      <div className="text-gray-500">
                        {format(parseISO(app.inizio), 'HH:mm')} - {format(parseISO(app.fine), 'HH:mm')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      {selected && (
        <Modal title="Dettaglio appuntamento" onClose={() => setSelected(null)} size="md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selected.cliente?.nome}</h3>
              <StatusBadge stato={selected.stato} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Servizio</div>
                <div className="font-medium">{selected.servizio?.nome}</div>
              </div>
              <div>
                <div className="text-gray-500">Barbiere</div>
                <div className="font-medium">{selected.staff?.nome}</div>
              </div>
              <div>
                <div className="text-gray-500">Inizio</div>
                <div className="font-medium">{format(parseISO(selected.inizio), 'HH:mm')}</div>
              </div>
              <div>
                <div className="text-gray-500">Fine</div>
                <div className="font-medium">{format(parseISO(selected.fine), 'HH:mm')}</div>
              </div>
              <div>
                <div className="text-gray-500">Importo</div>
                <div className="font-medium">€{selected.importo}</div>
              </div>
              {selected.cliente?.telefono && (
                <div>
                  <div className="text-gray-500">Telefono</div>
                  <div className="font-medium">{selected.cliente.telefono}</div>
                </div>
              )}
            </div>

            {selected.note && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <span className="font-medium">Note: </span>{selected.note}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {statiActions
                .filter((a) => a.stato !== selected.stato)
                .map((action) => (
                  <button
                    key={action.stato}
                    className="btn-secondary text-sm"
                    onClick={() => updateMutation.mutate({ id: selected.id, stato: action.stato })}
                    disabled={updateMutation.isPending}
                  >
                    {action.label}
                  </button>
                ))}
              <button
                className="btn-danger text-sm ml-auto"
                onClick={() => deleteMutation.mutate(selected.id)}
                disabled={deleteMutation.isPending}
              >
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
