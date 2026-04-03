import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api';
import { Servizio } from '../types';
import Modal from '../components/shared/Modal';

function toServiceForm(servizio?: Servizio) {
  return {
    nome: servizio?.nome ?? '',
    durataMini: servizio?.durataMini ?? 30,
    prezzo: servizio?.prezzo ?? 0,
    attivo: servizio?.attivo ?? true,
  };
}

export default function ServicesPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editingService, setEditingService] = useState<Servizio | null>(null);
  const [newForm, setNewForm] = useState(toServiceForm());
  const [editForm, setEditForm] = useState(toServiceForm());

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
      setNewForm(toServiceForm());
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, attivo }: { id: string; attivo: boolean }) =>
      servicesApi.update(id, { attivo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      servicesApi.update(id, {
        nome: editForm.nome,
        durataMini: Number(editForm.durataMini),
        prezzo: Number(editForm.prezzo),
        attivo: editForm.attivo,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      setEditingService(null);
      setEditForm(toServiceForm());
    },
  });

  function openEditModal(servizio: Servizio) {
    setEditingService(servizio);
    setEditForm(toServiceForm(servizio));
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Servizi</h1>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Nuovo servizio</button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servizi.map((servizio) => (
            <div key={servizio.id} className="card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-900">{servizio.nome}</div>
                  <div className="mt-1 text-sm text-gray-500">{servizio.durataMini} minuti</div>
                </div>
                <div className="text-lg font-bold text-brand-600">€{servizio.prezzo}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    servizio.attivo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {servizio.attivo ? 'Attivo' : 'Disattivato'}
                </span>
                <button onClick={() => openEditModal(servizio)} className="btn-secondary text-sm">
                  Modifica
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: servizio.id, attivo: !servizio.attivo })}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    servizio.attivo
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {servizio.attivo ? 'Metti in pausa' : 'Riattiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo servizio" onClose={() => setShowNew(false)} size="sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
              <input className="input" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Durata (minuti) *</label>
              <input className="input" type="number" min={5} value={newForm.durataMini} onChange={(e) => setNewForm((f) => ({ ...f, durataMini: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Prezzo (EUR) *</label>
              <input className="input" type="number" min={0} step={0.5} value={newForm.prezzo} onChange={(e) => setNewForm((f) => ({ ...f, prezzo: Number(e.target.value) }))} required />
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

      {editingService && (
        <Modal title="Modifica servizio" onClose={() => setEditingService(null)} size="sm">
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editingService.id); }} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
              <input className="input" value={editForm.nome} onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Durata (minuti) *</label>
              <input className="input" type="number" min={5} value={editForm.durataMini} onChange={(e) => setEditForm((f) => ({ ...f, durataMini: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Prezzo (EUR) *</label>
              <input className="input" type="number" min={0} step={0.5} value={editForm.prezzo} onChange={(e) => setEditForm((f) => ({ ...f, prezzo: Number(e.target.value) }))} required />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editForm.attivo}
                onChange={(e) => setEditForm((f) => ({ ...f, attivo: e.target.checked }))}
              />
              Servizio attivo e visibile nel portale cliente
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditingService(null)} className="btn-secondary flex-1">Annulla</button>
              <button type="submit" className="btn-primary flex-1" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
