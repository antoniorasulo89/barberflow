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

const STEPS = [
  { id: 'servizio' as BookingStep, label: 'Servizio' },
  { id: 'barbiere' as BookingStep, label: 'Barbiere' },
  { id: 'data' as BookingStep, label: 'Data & Ora' },
  { id: 'conferma' as BookingStep, label: 'Conferma' },
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

  if (isError) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">❌</div>
        <p className="text-gray-500 text-sm">Barbershop non trovato.</p>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Prenotazione confermata!</h2>
        <p className="text-gray-600 mb-1">
          <strong>{state.servizio?.nome}</strong> con <strong>{state.staff?.nome}</strong>
        </p>
        <p className="text-brand-600 font-semibold mb-6">
          {state.slot && format(parseISO(state.slot.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => {
              setState({ servizio: null, staff: null, date: format(new Date(), 'yyyy-MM-dd'), slot: null, nome: '', telefono: '', email: '' });
              setStep('servizio');
            }}
            className="btn-secondary"
          >
            Prenota di nuovo
          </button>
          <button onClick={onBooked} className="btn-primary">
            Le mie prenotazioni →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center mb-6">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
              idx < currentStepIdx ? 'bg-brand-500 text-white'
              : idx === currentStepIdx ? 'bg-brand-500 text-white ring-4 ring-brand-100'
              : 'bg-gray-100 text-gray-400'
            }`}>
              {idx < currentStepIdx ? '✓' : idx + 1}
            </div>
            <span className={`text-xs font-medium ml-1 hidden sm:inline ${idx === currentStepIdx ? 'text-brand-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${idx < currentStepIdx ? 'bg-brand-500' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Servizio */}
      {step === 'servizio' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Scegli il servizio</h2>
          <div className="space-y-2">
            {servizi.map((s) => (
              <button
                key={s.id}
                onClick={() => { setState((f) => ({ ...f, servizio: s })); setStep('barbiere'); }}
                className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors text-left"
              >
                <div>
                  <div className="font-semibold text-gray-900">{s.nome}</div>
                  <div className="text-sm text-gray-500">{s.durataMini} min</div>
                </div>
                <div className="text-lg font-bold text-brand-600">€{s.prezzo}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Barbiere */}
      {step === 'barbiere' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Scegli il barbiere</h2>
          <div className="space-y-2">
            {staffList.map((s) => (
              <button
                key={s.id}
                onClick={() => { setState((f) => ({ ...f, staff: s })); setStep('data'); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                  {s.nome.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{s.nome}</div>
                  <div className="text-sm text-gray-500">{s.ruolo}</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('servizio')} className="mt-4 text-sm text-gray-400 hover:text-gray-600">← Indietro</button>
        </div>
      )}

      {/* Step 3 — Data & Ora */}
      {step === 'data' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Scegli data e orario</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map((d) => {
              const ds = format(d, 'yyyy-MM-dd');
              return (
                <button
                  key={ds}
                  onClick={() => setState((f) => ({ ...f, date: ds, slot: null }))}
                  className={`flex-shrink-0 flex flex-col items-center p-2 rounded-lg border-2 text-xs transition-colors ${
                    state.date === ds
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-gray-200 hover:border-brand-300 text-gray-700'
                  }`}
                >
                  <span className="uppercase font-medium">{format(d, 'EEE', { locale: it })}</span>
                  <span className="text-lg font-bold">{format(d, 'd')}</span>
                  <span className="opacity-75">{format(d, 'MMM', { locale: it })}</span>
                </button>
              );
            })}
          </div>
          {loadingSlots ? (
            <div className="text-center py-6 text-gray-400">Caricamento slot...</div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.inizio}
                  onClick={() => setState((f) => ({ ...f, slot }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                    state.slot?.inizio === slot.inizio
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-400'
                  }`}
                >
                  {format(parseISO(slot.inizio), 'HH:mm')}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">
              Nessuno slot disponibile per questa data
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep('barbiere')} className="btn-secondary flex-1">← Indietro</button>
            <button onClick={() => setStep('conferma')} disabled={!state.slot} className="btn-primary flex-1">Avanti →</button>
          </div>
        </div>
      )}

      {/* Step 4 — Conferma */}
      {step === 'conferma' && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">I tuoi dati</h2>
          <div className="bg-brand-50 rounded-xl p-4 mb-5 text-sm space-y-1">
            <div className="font-semibold text-brand-900 mb-1">Riepilogo</div>
            <div className="text-brand-800">✂️ {state.servizio?.nome} — €{state.servizio?.prezzo}</div>
            <div className="text-brand-800">💈 {state.staff?.nome}</div>
            <div className="text-brand-800">
              📅 {state.slot && format(parseISO(state.slot.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <input className="input" value={state.nome} onChange={(e) => setState((f) => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input className="input" type="tel" placeholder="+39 333 1234567" value={state.telefono} onChange={(e) => setState((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input" type="email" value={state.email} onChange={(e) => setState((f) => ({ ...f, email: e.target.value }))} />
            </div>
            {bookMutation.isError && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                {(bookMutation.error as { error?: string })?.error ?? 'Errore nella prenotazione. Riprova.'}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep('data')} className="btn-secondary flex-1">← Indietro</button>
              <button type="submit" className="btn-primary flex-1" disabled={bookMutation.isPending}>
                {bookMutation.isPending ? 'Prenotazione...' : 'Conferma'}
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-appointments', slug] }),
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(phone);
    } catch (err: unknown) {
      setLoginError((err as { error?: string })?.error ?? 'Numero non trovato. Hai già effettuato prenotazioni?');
    } finally {
      setLoginLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Le mie prenotazioni</h2>
        <p className="text-sm text-gray-500 mb-6">
          Inserisci il numero di telefono usato durante la prenotazione.
        </p>
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
            />
          </div>
          {loginError && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{loginError}</div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loginLoading}>
            {loginLoading ? 'Ricerca...' : 'Vedi le mie prenotazioni →'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Ciao, {nome}!</h2>
          <p className="text-sm text-gray-500">Le tue prossime prenotazioni</p>
        </div>
        <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Esci
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Caricamento...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-gray-500 text-sm">Nessuna prenotazione in programma.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((app) => (
            <div key={app.id} className="border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{app.servizio?.nome}</div>
                  <div className="text-sm text-gray-500 mt-0.5">💈 {app.staff?.nome}</div>
                  <div className="text-sm text-brand-600 font-medium mt-1">
                    📅 {format(parseISO(app.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 mt-0.5">€{app.importo}</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
                      cancelMutation.mutate(app.id);
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 border border-red-100 hover:border-red-200"
                >
                  Cancella
                </button>
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
    <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-800">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl text-white">✂️</span>
          <span className="text-white font-bold text-lg">BarberFlow</span>
        </div>
        <Link
          to="/admin/login"
          className="text-white/70 hover:text-white text-sm font-medium transition-colors"
        >
          Dashboard Admin →
        </Link>
      </div>

      {/* Card */}
      <div className="flex justify-center px-4 pb-10">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('prenota')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'prenota'
                  ? 'text-brand-600 border-b-2 border-brand-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              ✂️ Prenota
            </button>
            <button
              onClick={() => setActiveTab('miei')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'miei'
                  ? 'text-brand-600 border-b-2 border-brand-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📅 Le mie prenotazioni
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
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
