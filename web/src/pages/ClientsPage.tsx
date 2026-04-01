import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientsApi } from '../api';
import { Cliente } from '../types';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import Modal from '../components/shared/Modal';

type SortKey = 'visite' | 'valore' | 'recenti' | 'nome';

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recenti');
  const [tagFilter, setTagFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ nome: '', telefono: '', email: '', tag: '' });

  const params: Record<string, string> = { sort, limit: '100' };
  if (search) params.search = search;
  if (tagFilter) params.tag = tagFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.list(params),
  });

  const clients: Cliente[] = data?.items ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      clientsApi.create({
        nome: newForm.nome,
        telefono: newForm.telefono || undefined,
        email: newForm.email || undefined,
        tag: newForm.tag ? newForm.tag.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      setShowNew(false);
      setNewForm({ nome: '', telefono: '', email: '', tag: '' });
    },
  });

  const allTags = [...new Set(clients.flatMap((c) => c.tag))];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Clienti</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Nuovo cliente</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="input max-w-64"
          placeholder="Cerca per nome, email, telefono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="recenti">Più recenti</option>
          <option value="visite">Più visite</option>
          <option value="valore">Valore maggiore</option>
          <option value="nome">Nome A-Z</option>
        </select>
        <select className="input w-auto" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">Tutti i tag</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-12">Caricamento...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Cliente', 'Contatti', 'Tag', 'Visite', 'Valore totale', 'Ultima visita', '', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${c.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                      {c.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div>{c.telefono}</div>
                    <div className="text-xs">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tag.map((t) => (
                        <span key={t} className="badge bg-brand-100 text-brand-700">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.visiteTotali}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-700">€{c.valoreTotale.toFixed(0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {c.ultimaVisita ? format(parseISO(c.ultimaVisita), 'd MMM yyyy', { locale: it }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/clients/${c.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                      Profilo →
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm(`Eliminare "${c.nome}"? Verranno cancellati anche tutti i suoi appuntamenti.`)) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:text-red-600 transition-colors text-sm"
                      title="Elimina cliente"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Nessun cliente trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <Modal title="Nuovo cliente" onClose={() => setShowNew(false)} size="sm">
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input className="input" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input className="input" value={newForm.telefono} onChange={(e) => setNewForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input" type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag (separati da virgola)</label>
              <input className="input" placeholder="vip, frequente..." value={newForm.tag} onChange={(e) => setNewForm((f) => ({ ...f, tag: e.target.value }))} />
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
