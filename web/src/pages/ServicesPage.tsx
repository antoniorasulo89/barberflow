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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Servizi</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">{servizi.length} {servizi.length === 1 ? 'servizio' : 'servizi'}</p>
          )}
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Nuovo servizio</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Caricamento...
        </div>
      ) : servizi.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-7 h-7">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/>
              <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Nessun servizio configurato</p>
          <p className="text-gray-400 text-sm mt-1">Aggiungi i servizi offerti dal tuo salone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servizi.map((s) => (
            <div key={s.id} className="card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{s.nome}</div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {s.durataMini} minuti
                  </div>
                </div>
                <div className="text-xl font-bold text-brand-600 flex-shrink-0">€{s.prezzo}</div>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ id: s.id, attivo: !s.attivo })}
                disabled={toggleMutation.isPending}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  s.attivo
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${s.attivo ? 'bg-green-500' : 'bg-gray-400'}`} />
                {s.attivo ? 'Attivo' : 'Non attivo'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo servizio" onClose={() => setShowNew(false)} size="sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome servizio <span className="text-red-400">*</span></label>
              <input className="input" placeholder="es. Taglio uomo" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durata (min) <span className="text-red-400">*</span></label>
                <input className="input" type="number" min={5} step={5} value={newForm.durataMini} onChange={(e) => setNewForm((f) => ({ ...f, durataMini: Number(e.target.value) }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€) <span className="text-red-400">*</span></label>
                <input className="input" type="number" min={0} step={0.5} value={newForm.prezzo} onChange={(e) => setNewForm((f) => ({ ...f, prezzo: Number(e.target.value) }))} required />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Annulla</button>
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creazione...' : 'Crea servizio'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
