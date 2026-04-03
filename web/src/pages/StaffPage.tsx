import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../api';
import { Staff } from '../types';
import Modal from '../components/shared/Modal';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export default function StaffPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [scheduleStaff, setScheduleStaff] = useState<Staff | null>(null);
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Staff</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Aggiungi barbiere</button>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-12">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div key={staff.id} className="card flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                  {staff.nome.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{staff.nome}</div>
                  <div className="text-sm text-gray-500">{staff.ruolo}</div>
                  {staff.telefono && <div className="text-xs text-gray-400">{staff.telefono}</div>}
                </div>
              </div>
              <button
                onClick={() => setScheduleStaff(staff)}
                className="btn-secondary text-sm"
              >
                Gestisci disponibilità
              </button>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo barbiere" onClose={() => setShowNew(false)} size="sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input className="input" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
              <input className="input" value={newForm.ruolo} onChange={(e) => setNewForm((f) => ({ ...f, ruolo: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input className="input" value={newForm.telefono} onChange={(e) => setNewForm((f) => ({ ...f, telefono: e.target.value }))} />
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
    </div>
  );
}

function ScheduleModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: schedule = [] } = useQuery({
    queryKey: ['schedule', staff.id],
    queryFn: () => staffApi.getSchedule(staff.id),
  });

  type SlotData = { giornoSettimana: number; oraInizio: string; oraFine: string; attivo: boolean };

  const [slots, setSlots] = useState<SlotData[]>(() => {
    if (schedule.length > 0) return schedule;
    return [1, 2, 3, 4, 5, 6].flatMap((d) => [
      { giornoSettimana: d, oraInizio: '09:00', oraFine: '13:00', attivo: true },
      { giornoSettimana: d, oraInizio: '15:00', oraFine: '19:00', attivo: true },
    ]);
  });

  const saveMutation = useMutation({
    mutationFn: () => staffApi.updateSchedule(staff.id, slots),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule', staff.id] });
      onClose();
    },
  });

  function toggleDay(day: number) {
    setSlots((prev) =>
      prev.map((s) => s.giornoSettimana === day ? { ...s, attivo: !s.attivo } : s)
    );
  }

  const days = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Modal title={`Disponibilità — ${staff.nome}`} onClose={onClose} size="lg">
      <div className="space-y-3">
        {days.map((day) => {
          const daySlots = slots.filter((s) => s.giornoSettimana === day);
          const active = daySlots.some((s) => s.attivo);
          return (
            <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-100">
              <div className="w-8 text-sm font-medium text-gray-700">{DAYS[day]}</div>
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`w-10 h-5 rounded-full transition-colors ${active ? 'bg-brand-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${active ? 'translate-x-5' : ''}`} />
              </button>
              {active && daySlots.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    className="input w-28 py-1"
                    value={slot.oraInizio}
                    onChange={(e) =>
                      setSlots((prev) =>
                        prev.map((s) =>
                          s === slot ? { ...s, oraInizio: e.target.value } : s
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
                        prev.map((s) =>
                          s === slot ? { ...s, oraFine: e.target.value } : s
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
