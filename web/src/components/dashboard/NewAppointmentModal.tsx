import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, clientsApi, staffApi, servicesApi, availabilityApi } from '../../api';
import { Cliente, Staff, Servizio, Slot } from '../../types';
import Modal from '../shared/Modal';
import { format, parseISO } from 'date-fns';

interface Props {
  onClose: () => void;
  date: string;
}

export default function NewAppointmentModal({ onClose, date }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    clienteId: '',
    staffId: '',
    servizioId: '',
    inizio: '',
    note: '',
  });

  const { data: clienti = [] } = useQuery<Cliente[]>({
    queryKey: ['clients-list'],
    queryFn: () => clientsApi.list({ limit: '500' }).then((d) => d.items ?? d),
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: staffApi.list,
  });

  const { data: servizi = [] } = useQuery<Servizio[]>({
    queryKey: ['services'],
    queryFn: servicesApi.list,
  });
  const activeServices = servizi.filter((servizio) => servizio.attivo);

  const availableStaff = form.servizioId
    ? staffList.filter((staff) =>
        staff.servizi?.some((servizio) => servizio.id === form.servizioId)
      )
    : staffList;

  const { data: slots = [], isFetching: loadingSlots } = useQuery<Slot[]>({
    queryKey: ['slots', form.staffId, date, form.servizioId],
    queryFn: () =>
      availabilityApi.getSlots({ staffId: form.staffId, date, serviceId: form.servizioId }),
    enabled: !!form.staffId && !!form.servizioId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        clienteId: form.clienteId,
        staffId: form.staffId,
        servizioId: form.servizioId,
        inizio: form.inizio,
        note: form.note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
  });

  const availableSlots = slots.filter((s) => s.disponibile);

  return (
    <Modal title="Nuovo appuntamento" onClose={onClose} size="md">
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select
            className="input"
            value={form.clienteId}
            onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}
            required
          >
            <option value="">Seleziona cliente...</option>
            {clienti.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servizio</label>
          <select
            className="input"
            value={form.servizioId}
            onChange={(e) => setForm((f) => ({ ...f, servizioId: e.target.value, staffId: '', inizio: '' }))}
            required
          >
            <option value="">Seleziona servizio...</option>
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>{s.nome} — {s.durataMini}min — €{s.prezzo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Barbiere</label>
          <select
            className="input"
            value={form.staffId}
            onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value, inizio: '' }))}
            required
          >
            <option value="">Seleziona barbiere...</option>
            {availableStaff.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          {form.servizioId && availableStaff.length === 0 && (
            <div className="mt-2 text-sm text-amber-700">
              Nessun professionista abilitato per questo servizio.
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Orario {loadingSlots && <span className="text-gray-400">(caricamento...)</span>}
          </label>
          {form.staffId && form.servizioId ? (
            availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.inizio}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, inizio: slot.inizio }))}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.inizio === slot.inizio
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'
                    }`}
                  >
                    {format(parseISO(slot.inizio), 'HH:mm')}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 py-3 text-center bg-gray-50 rounded-lg">
                Nessuno slot disponibile per questa data
              </div>
            )
          ) : (
            <div className="text-sm text-gray-400 py-3 text-center bg-gray-50 rounded-lg">
              Seleziona servizio e barbiere per vedere gli slot
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>

        {mutation.isError && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
            {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Errore nella creazione'}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={!form.clienteId || !form.staffId || !form.servizioId || !form.inizio || mutation.isPending}
          >
            {mutation.isPending ? 'Creazione...' : 'Crea appuntamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
