import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Servizio, Staff, Slot, Appuntamento } from '../types';
import { useClientAuth } from '../hooks/useClientAuth';

const API = import.meta.env.VITE_API_URL ?? '/api';

function publicFetch(slug: string, path: string, params?: Record<string, string>) {
  const url = new URL(`${API}/public/${slug}/${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url.toString()).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

// ─── Booking Tab ─────────────────────────────────────────────────────────────

type BookingStep = 'servizio' | 'barbiere' | 'data' | 'conferma' | 'done';

interface BookingState {
  servizio: Servizio | null;
  staff: Staff | null;
  date: string;
  slot: Slot | null;
  nome: string;
  telefono: string;
  email: string;
}

const STEPS: { id: BookingStep; label: string }[] = [
  { id: 'servizio', label: 'Servizio' },
  { id: 'barbiere', label: 'Professionista' },
  { id: 'data', label: 'Data & Ora' },
  { id: 'conferma', label: 'Conferma' },
];

function BookingTab({ slug, onBooked }: { slug: string; onBooked: () => void }) {
  const [step, setStep] = useState<BookingStep>('servizio');
  const [state, setState] = useState<BookingState>({
    servizio: null, staff: null,
    date: format(new Date(), 'yyyy-MM-dd'),
    slot: null, nome: '', telefono: '', email: '',
  });

  const { data: servizi = [], isError } = useQuery<Servizio[]>({
    queryKey: ['public-services', slug],
    queryFn: () => publicFetch(slug, 'services'),
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['public-staff', slug],
    queryFn: () => publicFetch(slug, 'staff'),
  });

  const { data: slots = [], isFetching: loadingSlots } = useQuery<Slot[]>({
    queryKey: ['public-slots', slug, state.staff?.id, state.date, state.servizio?.id],
    queryFn: () => publicFetch(slug, 'availability', {
      staffId: state.staff!.id,
      date: state.date,
      serviceId: state.servizio!.id,
    }),
    enabled: !!state.staff && !!state.servizio && step === 'data',
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      fetch(`${API}/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: state.nome,
          telefono: state.telefono || undefined,
          email: state.email || undefined,
          staffId: state.staff!.id,
          servizioId: state.servizio!.id,
          inizio: state.slot!.inizio,
        }),
      }).then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(d));
        return r.json();
      }),
    onSuccess: () => setStep('done'),
  });

  const availableSlots = slots.filter((s) => s.disponibile);
  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  function resetBooking() {
    setState({ servizio: null, staff: null, date: format(new Date(), 'yyyy-MM-dd'), slot: null, nome: '', telefono: '', email: '' });
    setStep('servizio');
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} className="w-6 h-6">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Salone non disponibile</p>
        <p className="text-gray-400 text-sm mt-1">Verifica il link o contatta il salone direttamente.</p>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="py-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} className="w-8 h-8">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Prenotazione confermata</h2>
          <p className="text-gray-500 text-sm">Ti aspettiamo!</p>
        </div>

        <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 mb-6 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Servizio</span>
            <span className="text-sm font-semibold text-gray-900">{state.servizio?.nome}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Professionista</span>
            <span className="text-sm font-semibold text-gray-900">{state.staff?.nome}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Data e ora</span>
            <span className="text-sm font-semibold text-gray-900">
              {state.slot && format(parseISO(state.slot.inizio), "d MMM 'alle' HH:mm", { locale: it })}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-white">
            <span className="text-sm font-medium text-gray-700">Totale</span>
            <span className="text-base font-bold text-brand-600">€{state.servizio?.prezzo}</span>
          </div>
        </div>

        {state.telefono && (
          <p className="text-center text-xs text-gray-400 mb-5">
            Se hai fornito il numero, potresti ricevere un promemoria prima dell'appuntamento.
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={resetBooking} className="btn-secondary flex-1">
            Nuova prenotazione
          </button>
          <button onClick={onBooked} className="btn-primary flex-1">
            Le mie prenotazioni
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center mb-7">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
              idx < currentStepIdx ? 'bg-brand-500 text-white'
              : idx === currentStepIdx ? 'bg-brand-500 text-white ring-4 ring-brand-100'
              : 'bg-gray-100 text-gray-400'
            }`}>
              {idx < currentStepIdx ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : idx + 1}
            </div>
            <span className={`text-xs font-medium ml-1.5 hidden sm:inline ${idx === currentStepIdx ? 'text-brand-600' : 'text-gray-300'}`}>
              {s.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${idx < currentStepIdx ? 'bg-brand-500' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Booking summary pill (visible from step 2+) */}
      {(step === 'barbiere' || step === 'data' || step === 'conferma') && (
        <div className="flex flex-wrap gap-2 mb-5">
          {state.servizio && (
            <button
              onClick={() => setStep('servizio')}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-3 py-1 hover:bg-brand-100 transition-colors"
            >
              {state.servizio.nome} · €{state.servizio.prezzo}
              {step !== 'barbiere' && <span className="text-brand-400">×</span>}
            </button>
          )}
          {state.staff && step !== 'barbiere' && (
            <button
              onClick={() => setStep('barbiere')}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-3 py-1 hover:bg-brand-100 transition-colors"
            >
              {state.staff.nome}
            </button>
          )}
          {state.slot && step === 'conferma' && (
            <span className="inline-flex items-center text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-3 py-1">
              {format(parseISO(state.slot.inizio), "d MMM · HH:mm", { locale: it })}
            </span>
          )}
        </div>
      )}

      {/* Step 1 — Servizio */}
      {step === 'servizio' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Scegli il servizio</h2>
          {servizi.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nessun servizio disponibile al momento.</div>
          ) : (
            <div className="space-y-2">
              {servizi.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setState((f) => ({ ...f, servizio: s })); setStep('barbiere'); }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-brand-400 hover:bg-brand-50 transition-all text-left group"
                >
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-brand-700">{s.nome}</div>
                    <div className="text-sm text-gray-400 mt-0.5">{s.durataMini} min</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-600">€{s.prezzo}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Barbiere */}
      {step === 'barbiere' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Scegli il professionista</h2>
          <div className="space-y-2">
            {staffList.map((s) => (
              <button
                key={s.id}
                onClick={() => { setState((f) => ({ ...f, staff: s })); setStep('data'); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-brand-400 hover:bg-brand-50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                  {s.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 group-hover:text-brand-700">{s.nome}</div>
                  <div className="text-sm text-gray-400 capitalize">{s.ruolo}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors flex-shrink-0">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('servizio')} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><polyline points="15 18 9 12 15 6"/></svg>
            Indietro
          </button>
        </div>
      )}

      {/* Step 3 — Data & Ora */}
      {step === 'data' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Scegli data e orario</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map((d) => {
              const ds = format(d, 'yyyy-MM-dd');
              return (
                <button
                  key={ds}
                  onClick={() => setState((f) => ({ ...f, date: ds, slot: null }))}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 text-xs transition-all ${
                    state.date === ds
                      ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                      : 'border-gray-100 hover:border-brand-300 text-gray-700 bg-white'
                  }`}
                >
                  <span className="uppercase font-medium opacity-75">{format(d, 'EEE', { locale: it })}</span>
                  <span className="text-base font-bold mt-0.5">{format(d, 'd')}</span>
                  <span className="opacity-60">{format(d, 'MMM', { locale: it })}</span>
                </button>
              );
            })}
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Verifica disponibilità...
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.inizio}
                  onClick={() => setState((f) => ({ ...f, slot }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    state.slot?.inizio === slot.inizio
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-100 hover:border-brand-400 hover:bg-brand-50'
                  }`}
                >
                  {format(parseISO(slot.inizio), 'HH:mm')}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.75} className="w-5 h-5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <p className="text-gray-600 text-sm font-medium">Nessuna disponibilità</p>
              <p className="text-gray-400 text-xs mt-1">Prova un altro giorno o un altro professionista.</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('barbiere')} className="btn-secondary flex-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mr-1 inline"><polyline points="15 18 9 12 15 6"/></svg>
              Indietro
            </button>
            <button onClick={() => setStep('conferma')} disabled={!state.slot} className="btn-primary flex-1">
              Avanti
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Conferma */}
      {step === 'conferma' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Inserisci i tuoi dati</h2>

          {/* Riepilogo */}
          <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 mb-5 overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Servizio</span>
              <span className="text-sm font-semibold text-gray-900">{state.servizio?.nome}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Professionista</span>
              <span className="text-sm font-semibold text-gray-900">{state.staff?.nome}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Data e ora</span>
              <span className="text-sm font-semibold text-gray-900">
                {state.slot && format(parseISO(state.slot.inizio), "d MMM 'alle' HH:mm", { locale: it })}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5 bg-white">
              <span className="text-sm font-medium text-gray-700">Totale</span>
              <span className="text-base font-bold text-brand-600">€{state.servizio?.prezzo}</span>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo <span className="text-red-400">*</span>
              </label>
              <input
                className="input"
                placeholder="Mario Rossi"
                value={state.nome}
                onChange={(e) => setState((f) => ({ ...f, nome: e.target.value }))}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero di telefono
                <span className="text-xs text-gray-400 font-normal ml-1">(per promemoria)</span>
              </label>
              <input
                className="input"
                type="tel"
                placeholder="+39 333 1234567"
                value={state.telefono}
                onChange={(e) => setState((f) => ({ ...f, telefono: e.target.value }))}
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                className="input"
                type="email"
                placeholder="mario@esempio.it"
                value={state.email}
                onChange={(e) => setState((f) => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>

            {bookMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{(bookMutation.error as { error?: string })?.error ?? 'Si è verificato un errore. Riprova o contatta il salone.'}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep('data')} className="btn-secondary flex-1">Indietro</button>
              <button type="submit" className="btn-primary flex-1" disabled={bookMutation.isPending}>
                {bookMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Prenotazione...
                  </span>
                ) : 'Conferma prenotazione'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── My Appointments Tab ──────────────────────────────────────────────────────

function MyAppointmentsTab({ slug }: { slug: string }) {
  const { token, nome, isAuthenticated, login, logout } = useClientAuth(slug);
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const { data: appointments = [], isLoading } = useQuery<Appuntamento[]>({
    queryKey: ['client-appointments', slug, token],
    queryFn: () =>
      fetch(`${API}/public/${slug}/client/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (r.status === 401) { logout(); return []; }
        return r.json();
      }),
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API}/public/${slug}/client/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    onSuccess: () => {
      setCancelingId(null);
      queryClient.invalidateQueries({ queryKey: ['client-appointments', slug] });
    },
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(phone);
    } catch (err: unknown) {
      setLoginError((err as { error?: string })?.error ?? 'Numero non trovato. Hai già effettuato una prenotazione?');
    } finally {
      setLoginLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#d97c12" strokeWidth={1.75} className="w-6 h-6">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Le mie prenotazioni</h2>
          <p className="text-sm text-gray-500">
            Inserisci il numero usato durante la prenotazione per accedere alle tue prenotazioni.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero di telefono</label>
            <input
              className="input"
              type="tel"
              placeholder="+39 333 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{loginError}</span>
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loginLoading}>
            {loginLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Ricerca in corso...
              </span>
            ) : 'Accedi alle mie prenotazioni'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Accesso senza password. Solo il numero usato durante la prenotazione.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Ciao, {nome}!</h2>
          <p className="text-sm text-gray-500">I tuoi prossimi appuntamenti</p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Esci
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Caricamento...
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.75} className="w-6 h-6">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="text-gray-600 font-medium text-sm">Nessun appuntamento in programma</p>
          <p className="text-gray-400 text-xs mt-1">Prenota il prossimo appuntamento dalla tab Prenota.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((app) => (
            <div key={app.id} className="rounded-xl border border-gray-100 overflow-hidden bg-white">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900">{app.servizio?.nome}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{app.staff?.nome}</div>
                    <div className="text-sm text-brand-600 font-medium mt-1.5">
                      {format(parseISO(app.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold mt-0.5">€{app.importo}</div>
                  </div>
                </div>

                {cancelingId === app.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">Sei sicuro di voler cancellare questo appuntamento?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCancelingId(null)}
                        className="btn-secondary flex-1 text-sm py-1.5"
                      >
                        Torna indietro
                      </button>
                      <button
                        onClick={() => cancelMutation.mutate(app.id)}
                        disabled={cancelMutation.isPending}
                        className="flex-1 text-sm py-1.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {cancelMutation.isPending ? 'Cancellazione...' : 'Sì, cancella'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCancelingId(app.id)}
                    className="mt-3 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100 hover:border-red-200 font-medium"
                  >
                    Cancella appuntamento
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<'prenota' | 'miei'>('prenota');

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75} className="w-4 h-4">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/>
              <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">BarberFlow</span>
        </div>
        <Link
          to="/admin/login"
          className="text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
        >
          Area gestione
        </Link>
      </div>

      {/* Hero text */}
      <div className="text-center px-5 pb-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Prenota il tuo appuntamento</h1>
        <p className="text-white/65 text-sm">Scegli il servizio, il professionista e l'orario che preferisci.</p>

        <div className="flex justify-center gap-5 mt-4 text-white/60 text-xs">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Prenotazione rapida
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Nessuna registrazione
          </span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Disponibilità in tempo reale
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="flex justify-center px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('prenota')}
              className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'prenota'
                  ? 'text-brand-600 border-b-2 border-brand-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                <line x1="8.12" y1="8.12" x2="12" y2="12"/>
              </svg>
              Prenota
            </button>
            <button
              onClick={() => setActiveTab('miei')}
              className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'miei'
                  ? 'text-brand-600 border-b-2 border-brand-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Le mie prenotazioni
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 sm:px-8">
            {activeTab === 'prenota' ? (
              <BookingTab slug={slug!} onBooked={() => setActiveTab('miei')} />
            ) : (
              <MyAppointmentsTab slug={slug!} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
