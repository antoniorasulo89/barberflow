import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, staffApi } from '../api';
import { Servizio, Staff } from '../types';
import Modal from '../components/shared/Modal';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const DEFAULT_SLOTS = [1, 2, 3, 4, 5, 6].flatMap((d) => [
  { giornoSettimana: d, oraInizio: '09:00', oraFine: '13:00', attivo: true },
  { giornoSettimana: d, oraInizio: '15:00', oraFine: '19:00', attivo: true },
]);

export default function StaffPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [scheduleStaff, setScheduleStaff] = useState<Staff | null>(null);
  const [servicesStaff, setServicesStaff] = useState<Staff | null>(null);
  const [newForm, setNewForm] = useState({ nome: '', ruolo: 'barbiere', telefono: '' });

  const { data: staffList = [], isLoading } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: staffApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () => staffApi.create({ nome: newForm.nome, ruolo: newForm.ruolo, telefono: newForm.telefono || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      setShowNew(false);
      setNewForm({ nome: '', ruolo: 'barbiere', telefono: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Aggiungi barbiere</button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((staff) => (
            <div key={staff.id} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                  {staff.nome.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{staff.nome}</div>
                  <div className="text-sm text-gray-500">{staff.ruolo}</div>
                  {staff.telefono && <div className="text-xs text-gray-400">{staff.telefono}</div>}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Servizi abilitati</div>
                {staff.servizi?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {staff.servizi.map((servizio) => (
                      <span key={servizio.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {servizio.nome}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Nessun servizio assegnato
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setServicesStaff(staff)} className="btn-secondary text-sm">
                  Gestisci servizi
                </button>
                <button onClick={() => setScheduleStaff(staff)} className="btn-secondary text-sm">
                  Gestisci disponibilita
                </button>
                <button
                  onClick={() => { if (confirm(`Eliminare ${staff.nome}?`)) deleteMutation.mutate(staff.id); }}
                  disabled={deleteMutation.isPending}
                  className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 text-sm"
                >
                  Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo barbiere" onClose={() => setShowNew(false)} size="sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
              <input className="input" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ruolo</label>
              <input className="input" value={newForm.ruolo} onChange={(e) => setNewForm((f) => ({ ...f, ruolo: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Telefono</label>
              <input className="input" value={newForm.telefono} onChange={(e) => setNewForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
              Il nuovo professionista eredita tutti i servizi attivi e puoi restringerli subito dopo dalla scheda staff.
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Annulla</button>
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creazione...' : 'Crea'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {scheduleStaff && (
        <ScheduleModal staff={scheduleStaff} onClose={() => setScheduleStaff(null)} />
      )}

      {servicesStaff && (
        <StaffServicesModal staff={servicesStaff} onClose={() => setServicesStaff(null)} />
      )}
    </div>
  );
}

function StaffServicesModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: services = [] } = useQuery<Servizio[]>({
    queryKey: ['services'],
    queryFn: servicesApi.list,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>(staff.servizi?.map((servizio) => servizio.id) ?? []);

  useEffect(() => {
    setSelectedIds(staff.servizi?.map((servizio) => servizio.id) ?? []);
  }, [staff]);

  const saveMutation = useMutation({
    mutationFn: () => staffApi.updateServices(staff.id, selectedIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      onClose();
    },
  });

  function toggleService(servizioId: string) {
    setSelectedIds((current) =>
      current.includes(servizioId)
        ? current.filter((id) => id !== servizioId)
        : [...current, servizioId]
    );
  }

  return (
    <Modal title={`Servizi eseguibili — ${staff.nome}`} onClose={onClose} size="md">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          Seleziona solo i servizi che questo professionista puo realmente eseguire. Il booking cliente e l&apos;agenda useranno questa regola.
        </p>
        <div className="space-y-3">
          {services.map((servizio) => (
            <label key={servizio.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selectedIds.includes(servizio.id)}
                onChange={() => toggleService(servizio.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{servizio.nome}</div>
                <div className="mt-1 text-slate-500">{servizio.durataMini} min · EUR {servizio.prezzo}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
          <button type="button" onClick={() => saveMutation.mutate()} className="btn-primary flex-1" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva servizi'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ScheduleModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: schedule = [] } = useQuery({
    queryKey: ['schedule', staff.id],
    queryFn: () => staffApi.getSchedule(staff.id),
  });

  type SlotData = { giornoSettimana: number; oraInizio: string; oraFine: string; attivo: boolean };

  const [slots, setSlots] = useState<SlotData[]>(DEFAULT_SLOTS);

  useEffect(() => {
    setSlots(schedule.length > 0 ? schedule : DEFAULT_SLOTS);
  }, [schedule]);

  const saveMutation = useMutation({
    mutationFn: () => staffApi.updateSchedule(staff.id, slots),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', staff.id] });
      onClose();
    },
  });

  function toggleDay(day: number) {
    setSlots((prev) =>
      prev.map((slot) => (slot.giornoSettimana === day ? { ...slot, attivo: !slot.attivo } : slot))
    );
  }

  const days = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Modal title={`Disponibilita — ${staff.nome}`} onClose={onClose} size="lg">
      <div className="space-y-3">
        {days.map((day) => {
          const daySlots = slots
            .map((slot, index) => ({ slot, index }))
            .filter(({ slot }) => slot.giornoSettimana === day);
          const active = daySlots.some(({ slot }) => slot.attivo);
          return (
            <div key={day} className="flex items-center gap-4 border-b border-gray-100 py-2">
              <div className="w-8 text-sm font-medium text-gray-700">{DAYS[day]}</div>
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`h-5 w-10 rounded-full transition-colors ${active ? 'bg-brand-500' : 'bg-gray-300'}`}
              >
                <div className={`mx-0.5 h-4 w-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : ''}`} />
              </button>
              {active && daySlots.map(({ slot, index }) => (
                <div key={`${day}-${index}`} className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    className="input w-28 py-1"
                    value={slot.oraInizio}
                    onChange={(e) =>
                      setSlots((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, oraInizio: e.target.value } : current
                        )
                      )
                    }
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="time"
                    className="input w-28 py-1"
                    value={slot.oraFine}
                    onChange={(e) =>
                      setSlots((prev) =>
                        prev.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, oraFine: e.target.value } : current
                        )
                      )
                    }
                  />
                </div>
              ))}
              {!active && <span className="text-sm text-gray-400">Chiuso</span>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="btn-secondary flex-1">Annulla</button>
        <button onClick={() => saveMutation.mutate()} className="btn-primary flex-1" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </Modal>
  );
}
