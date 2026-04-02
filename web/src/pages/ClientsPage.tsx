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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    onSuccess: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clienti</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">{clients.length} {clients.length === 1 ? 'cliente' : 'clienti'}</p>
          )}
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <span className="hidden sm:inline">+ Nuovo cliente</span>
          <span className="sm:hidden">+ Nuovo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input pl-9"
            placeholder="Cerca nome, email, telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="recenti">Più recenti</option>
          <option value="visite">Più visite</option>
          <option value="valore">Valore maggiore</option>
          <option value="nome">Nome A–Z</option>
        </select>
        {allTags.length > 0 && (
          <select className="input w-auto" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">Tutti i tag</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Caricamento clienti...
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-7 h-7">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Nessun cliente trovato</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || tagFilter ? 'Prova a modificare i filtri di ricerca.' : 'Aggiungi il primo cliente con il pulsante in alto.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Cliente', 'Contatti', 'Tag', 'Visite', 'Valore', 'Ultima visita', '', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <Link to={`/admin/clients/${c.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.telefono && <div>{c.telefono}</div>}
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tag.map((t) => (
                          <span key={t} className="badge bg-brand-50 text-brand-700 border border-brand-100">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.visiteTotali}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">€{c.valoreTotale.toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.ultimaVisita ? format(parseISO(c.ultimaVisita), 'd MMM yyyy', { locale: it }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/clients/${c.id}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Profilo →
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deletingId === c.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Annulla
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(c.id)}
                            disabled={deleteMutation.isPending}
                            className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded disabled:opacity-50 transition-colors"
                          >
                            {deleteMutation.isPending ? '...' : 'Elimina'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(c.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                          title="Elimina cliente"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {clients.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <Link to={`/admin/clients/${c.id}`} className="font-semibold text-gray-900 truncate hover:text-brand-600">
                        {c.nome}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-500">
                      <span className="font-semibold text-green-700">€{c.valoreTotale.toFixed(0)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{c.visiteTotali} visite</span>
                    </div>
                  </div>

                  {(c.telefono || c.email) && (
                    <div className="text-sm text-gray-500 ml-12 mb-2">
                      {c.telefono && <div>{c.telefono}</div>}
                      {c.email && <div className="text-xs">{c.email}</div>}
                    </div>
                  )}

                  {c.tag.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-12 mb-3">
                      {c.tag.map((t) => (
                        <span key={t} className="badge bg-brand-50 text-brand-700 border border-brand-100">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-12">
                    <Link to={`/admin/clients/${c.id}`} className="text-brand-600 text-sm font-medium hover:text-brand-700">
                      Vedi profilo →
                    </Link>
                    {deletingId === c.id ? (
                      <>
                        <span className="text-gray-300">·</span>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-gray-500">Annulla</button>
                        <button
                          onClick={() => deleteMutation.mutate(c.id)}
                          disabled={deleteMutation.isPending}
                          className="text-xs text-red-600 font-medium disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? 'Eliminazione...' : 'Conferma elimina'}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300">·</span>
                        <button onClick={() => setDeletingId(c.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                          Elimina
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showNew && (
        <Modal title="Nuovo cliente" onClose={() => setShowNew(false)} size="sm">
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo <span className="text-red-400">*</span></label>
              <input className="input" placeholder="Mario Rossi" value={newForm.nome} onChange={(e) => setNewForm((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input className="input" type="tel" placeholder="+39 333 1234567" value={newForm.telefono} onChange={(e) => setNewForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input" type="email" placeholder="mario@esempio.it" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
              <input className="input" placeholder="vip, frequente..." value={newForm.tag} onChange={(e) => setNewForm((f) => ({ ...f, tag: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Separati da virgola</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">Annulla</button>
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creazione...' : 'Crea cliente'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
