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
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      setClientToDelete(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      clientsApi.create({
        nome: newForm.nome,
        telefono: newForm.telefono || undefined,
        email: newForm.email || undefined,
        tag: newForm.tag ? newForm.tag.split(',').map((item) => item.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      setShowNew(false);
      setNewForm({ nome: '', telefono: '', email: '', tag: '' });
    },
  });

  const allTags = [...new Set(clients.flatMap((client) => client.tag))];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Rubrica clienti</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Clienti e relazioni ricorrenti</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Cerca rapidamente, controlla il valore generato e apri ogni profilo senza perdere il contesto del lavoro giornaliero.
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          Nuovo cliente
        </button>
      </div>

      <div className="surface-panel p-4 sm:p-6">
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_auto_auto]">
          <input
            className="input"
            placeholder="Cerca per nome, email o telefono"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="input lg:w-52" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="recenti">Piu recenti</option>
            <option value="visite">Piu visite</option>
            <option value="valore">Valore maggiore</option>
            <option value="nome">Nome A-Z</option>
          </select>
          <select className="input lg:w-52" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="">Tutti i tag</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="rounded-2xl bg-slate-50 py-10 text-center text-sm text-slate-500">Caricamento clienti...</div>
        ) : clients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
            Nessun cliente trovato. Prova a cambiare filtri oppure crea il primo profilo direttamente da questa schermata.
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Cliente', 'Contatti', 'Tag', 'Visite', 'Valore', 'Ultima visita', ''].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {clients.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <Link to={`/admin/clients/${client.id}`} className="font-semibold text-slate-950 hover:text-brand-700">
                          {client.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        <div>{client.telefono || 'Telefono non inserito'}</div>
                        <div className="text-xs">{client.email || 'Email non inserita'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {client.tag.map((tag) => (
                            <span key={tag} className="badge bg-brand-100 text-brand-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">{client.visiteTotali}</td>
                      <td className="px-4 py-4 text-sm font-medium text-emerald-700">EUR {client.valoreTotale.toFixed(0)}</td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {client.ultimaVisita ? format(parseISO(client.ultimaVisita), 'd MMM yyyy', { locale: it }) : 'Nessuna visita'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/clients/${client.id}`} className="btn-secondary">
                            Profilo
                          </Link>
                          <button onClick={() => setClientToDelete(client)} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50">
                            Elimina
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {clients.map((client) => (
                <article key={client.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/admin/clients/${client.id}`} className="text-lg font-semibold text-slate-950 hover:text-brand-700">
                        {client.nome}
                      </Link>
                      <div className="mt-1 text-sm text-slate-500">{client.telefono || 'Telefono non inserito'}</div>
                      <div className="text-sm text-slate-500">{client.email || 'Email non inserita'}</div>
                    </div>
                    <div className="rounded-2xl bg-brand-50 px-3 py-2 text-right text-sm font-semibold text-brand-700">
                      EUR {client.valoreTotale.toFixed(0)}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {client.tag.map((tag) => (
                      <span key={tag} className="badge bg-brand-100 text-brand-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>Visite totali: {client.visiteTotali}</div>
                    <div>
                      Ultima visita:{' '}
                      {client.ultimaVisita ? format(parseISO(client.ultimaVisita), 'd MMM yyyy', { locale: it }) : 'Nessuna visita'}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/admin/clients/${client.id}`} className="btn-secondary flex-1">
                      Apri profilo
                    </Link>
                    <button onClick={() => setClientToDelete(client)} className="btn-secondary flex-1 border-red-200 text-red-600 hover:bg-red-50">
                      Elimina
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {showNew && (
        <Modal title="Nuovo cliente" onClose={() => setShowNew(false)} size="sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
              <input className="input" value={newForm.nome} onChange={(event) => setNewForm((current) => ({ ...current, nome: event.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefono</label>
              <input className="input" value={newForm.telefono} onChange={(event) => setNewForm((current) => ({ ...current, telefono: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input className="input" type="email" value={newForm.email} onChange={(event) => setNewForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tag</label>
              <input className="input" placeholder="vip, ricorrente, premium" value={newForm.tag} onChange={(event) => setNewForm((current) => ({ ...current, tag: event.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="btn-secondary flex-1">
                Annulla
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creazione...' : 'Crea cliente'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {clientToDelete && (
        <Modal title="Elimina cliente" onClose={() => setClientToDelete(null)} size="sm">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Stai per eliminare <strong className="text-slate-900">{clientToDelete.nome}</strong> insieme ai suoi appuntamenti associati.
            </p>
            <p>Questa azione e irreversibile.</p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setClientToDelete(null)} className="btn-secondary flex-1">
                Annulla
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(clientToDelete.id)}
                className="btn-danger flex-1"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminazione...' : 'Conferma'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
