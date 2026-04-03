import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api';
import { Servizio } from '../types';
import Modal from '../components/shared/Modal';

export default function ServicesPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nome: '', durataMini: 30, prezzo: 0 });
  const [editService, setEditService] = useState<Servizio | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', durataMini: 30, prezzo: 0 });

  const { data: servizi = [], isLoading } = useQuery<Servizio[]>({
    queryKey: ['services'],
    queryFn: servicesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      servicesApi.create({
        nome: newForm.nome,
        durataMini: Number(newForm.durataMini),
        prezzo: Number(newForm.prezzo),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setShowNew(false);
      setNewForm({ nome: '', durataMini: 30, prezzo: 0 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      servicesApi.update(editService!.id, {
        nome: editForm.nome,
        durataMini: Number(editForm.durataMini),
        prezzo: Number(editForm.prezzo),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setEditService(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, attivo }: { id: string; attivo: boolean }) => servicesApi.update(id, { attivo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Servizi</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          + Nuovo servizio
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servizi.map((service) => (
            <div key={service.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900">{service.nome}</div>
                  <div className="mt-1 text-sm text-gray-500">{service.durataMini} minuti</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-600">EUR {service.prezzo}</div>
                  <div className={`mt-1 text-xs font-medium ${service.attivo ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {service.attivo ? 'Attivo nel booking' : 'Nascosto nel booking'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: service.id, attivo: !service.attivo })}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    service.attivo
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {service.attivo ? 'Attivo' : 'Disattivato'}
                </button>
                <button
                  onClick={() => {
                    setEditService(service);
                    setEditForm({ nome: service.nome, durataMini: service.durataMini, prezzo: service.prezzo });
                  }}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Modifica
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo servizio" onClose={() => setShowNew(false)} size="sm">
          <form onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
              <input className="input" value={newForm.nome} onChange={(event) => setNewForm((form) => ({ ...form, nome: event.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Durata (minuti) *</label>
              <input className="input" type="number" min={5} value={newForm.durataMini} onChange={(event) => setNewForm((form) => ({ ...form, durataMini: Number(event.target.value) }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Prezzo (EUR) *</label>
              <input className="input" type="number" min={0} step={0.5} value={newForm.prezzo} onChange={(event) => setNewForm((form) => ({ ...form, prezzo: Number(event.target.value) }))} required />
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

      {editService && (
        <Modal title="Modifica servizio" onClose={() => setEditService(null)} size="sm">
          <form onSubmit={(event) => { event.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
              <input className="input" value={editForm.nome} onChange={(event) => setEditForm((form) => ({ ...form, nome: event.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Durata (minuti) *</label>
              <input className="input" type="number" min={5} value={editForm.durataMini} onChange={(event) => setEditForm((form) => ({ ...form, durataMini: Number(event.target.value) }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Prezzo (EUR) *</label>
              <input className="input" type="number" min={0} step={0.5} value={editForm.prezzo} onChange={(event) => setEditForm((form) => ({ ...form, prezzo: Number(event.target.value) }))} required />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditService(null)} className="btn-secondary flex-1">Annulla</button>
              <button type="submit" className="btn-primary flex-1" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
