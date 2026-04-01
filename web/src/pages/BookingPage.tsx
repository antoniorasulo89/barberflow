import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, parseISO, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Servizio, Staff, Slot } from '../types';

const API = import.meta.env.VITE_API_URL ?? '/api';

function publicFetch(slug: string, path: string, params?: Record<string, string>) {
  const url = new URL(`${API}/public/${slug}/${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url.toString()).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

type Step = 'servizio' | 'barbiere' | 'data' | 'conferma' | 'done';

interface BookingState {
  servizio: Servizio | null;
  staff: Staff | null;
  date: string;
  slot: Slot | null;
  nome: string;
  telefono: string;
  email: string;
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'servizio', label: 'Servizio' },
  { id: 'barbiere', label: 'Barbiere' },
  { id: 'data', label: 'Data & Ora' },
  { id: 'conferma', label: 'Conferma' },
];

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<Step>('servizio');
  const [state, setState] = useState<BookingState>({
    servizio: null, staff: null,
    date: format(new Date(), 'yyyy-MM-dd'),
    slot: null, nome: '', telefono: '', email: '',
  });

  const { data: servizi = [], isError: serviziError } = useQuery<Servizio[]>({
    queryKey: ['public-services', slug],
    queryFn: () => publicFetch(slug!, 'services'),
    enabled: !!slug,
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['public-staff', slug],
    queryFn: () => publicFetch(slug!, 'staff'),
    enabled: !!slug,
  });

  const { data: slots = [], isFetching: loadingSlots } = useQuery<Slot[]>({
    queryKey: ['public-slots', slug, state.staff?.id, state.date, state.servizio?.id],
    queryFn: () => publicFetch(slug!, 'availability', {
      staffId: state.staff!.id,
      date: state.date,
      serviceId: state.servizio!.id,
    }),
    enabled: !!slug && !!state.staff && !!state.servizio && step === 'data',
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

  if (serviziError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-xl font-bold text-gray-900">Barbershop non trovato</h2>
          <p className="text-gray-500 mt-2 text-sm">Lo slug <code className="bg-gray-100 px-1 rounded">{slug}</code> non esiste.</p>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prenotazione confermata!</h2>
          <p className="text-gray-600 mb-6">
            Appuntamento per <strong>{state.servizio?.nome}</strong> con <strong>{state.staff?.nome}</strong>
            {' '}il <strong>{format(parseISO(state.slot!.inizio), 'd MMMM yyyy', { locale: it })}</strong>
            {' '}alle <strong>{format(parseISO(state.slot!.inizio), 'HH:mm')}</strong>.
          </p>
          {(state.telefono || state.email) && (
            <p className="text-sm text-gray-400">Riceverai una conferma via {state.telefono ? 'SMS' : 'email'}.</p>
          )}
          <button
            onClick={() => {
              setState({ servizio: null, staff: null, date: format(new Date(), 'yyyy-MM-dd'), slot: null, nome: '', telefono: '', email: '' });
              setStep('servizio');
            }}
            className="mt-6 btn-secondary"
          >
            Prenota di nuovo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header + stepper */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">✂️</span>
            <span className="font-bold text-gray-900 text-lg">BarberFlow</span>
          </div>
          <div className="flex items-center">
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
        </div>

        <div className="px-8 py-6">

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

              {/* Date strip */}
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

              {/* Slot grid */}
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
                <button onClick={() => setStep('conferma')} disabled={!state.slot} className="btn-primary flex-1">
                  Avanti →
                </button>
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

              <form
                onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input
                    className="input"
                    value={state.nome}
                    onChange={(e) => setState((f) => ({ ...f, nome: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="+39 333 1234567"
                    value={state.telefono}
                    onChange={(e) => setState((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={state.email}
                    onChange={(e) => setState((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                {bookMutation.isError && (
                  <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    {(bookMutation.error as { error?: string })?.error ?? 'Errore nella prenotazione. Riprova.'}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep('data')} className="btn-secondary flex-1">← Indietro</button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={bookMutation.isPending}
                  >
                    {bookMutation.isPending ? 'Prenotazione...' : 'Conferma'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
