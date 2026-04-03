import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api';
import { Servizio } from '../types';
import Modal from '../components/shared/Modal';

export default function ServicesPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nome: '', durataMini: 30, prezzo: 0 });

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

  const toggleMutation = useMutation({
    mutationFn: ({ id, attivo }: { id: string; attivo: boolean }) =>
      servicesApi.update(id, { attivo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Servizi</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Nuovo servizio</button>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-12">Caricamento...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servizi.map((s) => (
            <div key={s.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{s.nome}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.durataMini} minuti</div>
                </div>
                <div className="text-lg font-bold text-brand-600">€{s.prezzo}</div>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ id: s.id, attivo: !s.attivo })}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  s.attivo
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {s.attivo ? '✓ Attivo' : 'Disattivato'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo servizio" onClose={() => setShowNew(false)} size="sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input className="input" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durata (minuti) *</label>
              <input className="input" type="number" min={5} value={newForm.durataMini} onChange={(e) => setNewForm((f) => ({ ...f, durataMini: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€) *</label>
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
    </div>
  );
}
