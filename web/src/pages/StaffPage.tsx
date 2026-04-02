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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">{staffList.length} {staffList.length === 1 ? 'professionista' : 'professionisti'}</p>
          )}
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Aggiungi</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Caricamento...
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-7 h-7">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Nessun professionista configurato</p>
          <p className="text-gray-400 text-sm mt-1">Aggiungi i membri del tuo team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div key={staff.id} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg flex-shrink-0">
                  {staff.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{staff.nome}</div>
                  <div className="text-sm text-gray-400 capitalize">{staff.ruolo}</div>
                  {staff.telefono && (
                    <div className="text-xs text-gray-400 mt-0.5">{staff.telefono}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setScheduleStaff(staff)}
                className="btn-secondary text-sm flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Gestisci disponibilità
              </button>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo professionista" onClose={() => setShowNew(false)} size="sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-400">*</span></label>
              <input className="input" placeholder="Mario Rossi" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
              <input className="input" placeholder="barbiere" value={newForm.ruolo} onChange={(e) => setNewForm((f) => ({ ...f, ruolo: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input className="input" type="tel" placeholder="+39 333 1234567" value={newForm.telefono} onChange={(e) => setNewForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Annulla</button>
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creazione...' : 'Crea profilo'}
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
      <div className="space-y-2">
        {days.map((day) => {
          const daySlots = slots.filter((s) => s.giornoSettimana === day);
          const active = daySlots.some((s) => s.attivo);
          return (
            <div key={day} className={`flex items-center gap-4 py-3 px-3 rounded-lg border transition-colors ${active ? 'border-gray-100 bg-white' : 'border-gray-50 bg-gray-50'}`}>
              <div className="w-8 text-sm font-semibold text-gray-700">{DAYS[day]}</div>
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${active ? 'bg-brand-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              {active ? (
                daySlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      className="input w-28 py-1 text-sm"
                      value={slot.oraInizio}
                      onChange={(e) =>
                        setSlots((prev) =>
                          prev.map((s) => s === slot ? { ...s, oraInizio: e.target.value } : s)
                        )
                      }
                    />
                    <span className="text-gray-300">—</span>
                    <input
                      type="time"
                      className="input w-28 py-1 text-sm"
                      value={slot.oraFine}
                      onChange={(e) =>
                        setSlots((prev) =>
                          prev.map((s) => s === slot ? { ...s, oraFine: e.target.value } : s)
                        )
                      }
                    />
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-400">Giorno chiuso</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 pt-5">
        <button onClick={onClose} className="btn-secondary flex-1">Annulla</button>
        <button onClick={() => saveMutation.mutate()} className="btn-primary flex-1" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva disponibilità'}
        </button>
      </div>
    </Modal>
  );
}
