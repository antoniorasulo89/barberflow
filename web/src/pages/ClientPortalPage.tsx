import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Servizio, Staff, Slot, Appuntamento } from '../types';
import { useClientAuth } from '../hooks/useClientAuth';
import Modal from '../components/shared/Modal';

const API = import.meta.env.VITE_API_URL ?? '/api';

function publicFetch(slug: string, path: string, params?: Record<string, string>) {
  const url = new URL(`${API}/public/${slug}/${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url.toString()).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

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
  { id: 'barbiere' as BookingStep, label: 'Professionista' },
  { id: 'data' as BookingStep, label: 'Data e ora' },
  { id: 'conferma' as BookingStep, label: 'Conferma' },
];

const CLIENT_STATUS_LABELS: Record<Appuntamento['stato'], string> = {
  pending: 'In attesa',
  confirmed: 'Confermato',
  done: 'Completato',
  noshow: 'No-show',
  cancelled: 'Cancellato',
};

function BookingSummary({ state }: { state: BookingState }) {
  const items = [
    ['Servizio', state.servizio ? `${state.servizio.nome} · ${state.servizio.durataMini} min` : 'Da scegliere'],
    ['Professionista', state.staff?.nome ?? 'Da scegliere'],
    ['Quando', state.slot ? format(parseISO(state.slot.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it }) : state.date ? format(parseISO(`${state.date}T00:00:00`), 'd MMMM yyyy', { locale: it }) : 'Da scegliere'],
    ['Prezzo', state.servizio ? `EUR ${state.servizio.prezzo}` : 'Da definire'],
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Riepilogo live</div>
      <div className="mt-3 text-lg font-semibold">Prenotazione semplice e trasparente</div>
      <div className="mt-5 space-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
            <div className="text-sm text-white/55">{label}</div>
            <div className="max-w-[65%] text-right text-sm font-medium text-white/90">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/75">
        Nessuna registrazione obbligatoria. Confermi in pochi passaggi e puoi rivedere o cancellare gli appuntamenti in autonomia.
      </div>
    </div>
  );
}

function BookingTab({ slug, onBooked }: { slug: string; onBooked: () => void }) {
  const [step, setStep] = useState<BookingStep>('servizio');
  const [state, setState] = useState<BookingState>({
    servizio: null,
    staff: null,
    date: format(new Date(), 'yyyy-MM-dd'),
    slot: null,
    nome: '',
    telefono: '',
    email: '',
  });

  const { data: servizi = [], isError } = useQuery<Servizio[]>({
    queryKey: ['public-services', slug],
    queryFn: () => publicFetch(slug, 'services'),
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['public-staff', slug, state.servizio?.id ?? 'all'],
    queryFn: () =>
      publicFetch(
        slug,
        'staff',
        state.servizio ? { serviceId: state.servizio.id } : undefined
      ),
  });

  const { data: slots = [], isFetching: loadingSlots } = useQuery<Slot[]>({
    queryKey: ['public-slots', slug, state.staff?.id, state.date, state.servizio?.id],
    queryFn: () =>
      publicFetch(slug, 'availability', {
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
  const currentStepIdx = STEPS.findIndex((item) => item.id === step);

  if (isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-900">Workspace non disponibile</h2>
        <p className="mt-2 text-sm leading-6 text-red-700">
          Questo link non risulta attivo. Controlla l&apos;indirizzo oppure torna alla home del prodotto.
        </p>
        <Link to="/" className="btn-secondary mt-4">
          Torna a BarberFlow
        </Link>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="rounded-[32px] border border-emerald-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          OK
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Prenotazione confermata</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Il tuo appuntamento e stato registrato correttamente. Qui sotto trovi il riepilogo con i dettagli principali.
        </p>
        <div className="mx-auto mt-6 max-w-md rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Servizio</span>
              <span className="font-medium text-slate-900">{state.servizio?.nome}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Professionista</span>
              <span className="font-medium text-slate-900">{state.staff?.nome}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Data e ora</span>
              <span className="text-right font-medium text-slate-900">
                {state.slot && format(parseISO(state.slot.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Contatto</span>
              <span className="text-right font-medium text-slate-900">{state.telefono || state.email || 'Nessun contatto inserito'}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setState({
                servizio: null,
                staff: null,
                date: format(new Date(), 'yyyy-MM-dd'),
                slot: null,
                nome: '',
                telefono: '',
                email: '',
              });
              setStep('servizio');
            }}
            className="btn-secondary"
          >
            Prenota di nuovo
          </button>
          <button onClick={onBooked} className="btn-primary">
            Vedi le mie prenotazioni
          </button>
          <Link to="/" className="btn-secondary">
            Torna all&apos;inizio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="surface-panel p-6 sm:p-8">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Prenotazione guidata</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Blocca il tuo slot in pochi passaggi</h2>
        </div>

        <div className="mb-8 flex items-center">
          {STEPS.map((item, index) => (
            <div key={item.id} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  index < currentStepIdx
                    ? 'bg-brand-500 text-white'
                    : index === currentStepIdx
                      ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {index + 1}
              </div>
              <span className={`ml-2 hidden text-xs font-medium sm:inline ${index === currentStepIdx ? 'text-brand-700' : 'text-slate-400'}`}>
                {item.label}
              </span>
              {index < STEPS.length - 1 && (
                <div className={`mx-3 h-0.5 flex-1 ${index < currentStepIdx ? 'bg-brand-500' : 'bg-slate-100'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 'servizio' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Scegli il servizio</h3>
            <div className="space-y-3">
              {servizi.map((servizio) => (
                <button
                  key={servizio.id}
                  onClick={() => {
                    setState((current) => ({ ...current, servizio, staff: null, slot: null }));
                    setStep('barbiere');
                  }}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-950">{servizio.nome}</div>
                      <div className="mt-1 text-sm text-slate-500">{servizio.durataMini} minuti</div>
                    </div>
                    <div className="text-sm font-semibold text-brand-700">EUR {servizio.prezzo}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'barbiere' && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Seleziona il professionista</h3>
            <div className="space-y-3">
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => {
                    setState((current) => ({ ...current, staff }));
                    setStep('data');
                  }}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                      {staff.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-950">{staff.nome}</div>
                      <div className="text-sm text-slate-500">{staff.ruolo}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {staffList.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Nessun professionista disponibile per questo servizio. Prova a scegliere un servizio diverso o aggiorna le assegnazioni staff.
              </div>
            )}
            <button onClick={() => setStep('servizio')} className="mt-5 text-sm font-medium text-slate-500 hover:text-slate-700">
              Torna ai servizi
            </button>
          </div>
        )}

        {step === 'data' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">Scegli data e orario</h3>
              <p className="mt-1 text-sm text-slate-500">Disponibilita aggiornata in tempo reale, senza refresh manuali.</p>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 14 }, (_, index) => addDays(new Date(), index)).map((day) => {
                const dayString = format(day, 'yyyy-MM-dd');
                const isSelected = state.date === dayString;
                return (
                  <button
                    key={dayString}
                    onClick={() => setState((current) => ({ ...current, date: dayString, slot: null }))}
                    className={`flex-shrink-0 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
                    }`}
                  >
                    <div className="text-xs uppercase">{format(day, 'EEE', { locale: it })}</div>
                    <div className="mt-1 text-lg font-semibold">{format(day, 'd')}</div>
                    <div className="text-xs">{format(day, 'MMM', { locale: it })}</div>
                  </button>
                );
              })}
            </div>

            {loadingSlots ? (
              <div className="rounded-2xl bg-slate-50 py-6 text-center text-sm text-slate-500">Caricamento degli slot disponibili...</div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.inizio}
                    onClick={() => setState((current) => ({ ...current, slot }))}
                    className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${
                      state.slot?.inizio === slot.inizio
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
                    }`}
                  >
                    {format(parseISO(slot.inizio), 'HH:mm')}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Nessuno slot disponibile per questa data. Prova un altro giorno o scegli un professionista differente.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep('barbiere')} className="btn-secondary flex-1">
                Indietro
              </button>
              <button onClick={() => setStep('conferma')} disabled={!state.slot} className="btn-primary flex-1">
                Continua
              </button>
            </div>
          </div>
        )}

        {step === 'conferma' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">Conferma i tuoi dati</h3>
              <p className="mt-1 text-sm text-slate-500">Ti contatteremo solo se serve aggiornare o ricordare l&apos;appuntamento.</p>
            </div>

            <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-brand-900">
              <div className="font-semibold">Riepilogo appuntamento</div>
              <div className="mt-2">{state.servizio?.nome} con {state.staff?.nome}</div>
              <div>{state.slot && format(parseISO(state.slot.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}</div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                bookMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
                <input
                  className="input"
                  value={state.nome}
                  onChange={(event) => setState((current) => ({ ...current, nome: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Telefono</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={state.telefono}
                  onChange={(event) => setState((current) => ({ ...current, telefono: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="nome@email.it"
                  value={state.email}
                  onChange={(event) => setState((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
              {bookMutation.isError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {(bookMutation.error as { error?: string })?.error ?? 'Errore nella prenotazione. Riprova tra qualche istante.'}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('data')} className="btn-secondary flex-1">
                  Indietro
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={bookMutation.isPending}>
                  {bookMutation.isPending ? 'Conferma in corso...' : 'Conferma appuntamento'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <BookingSummary state={state} />
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Perche funziona</div>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <p>Prenotazione rapida, senza account obbligatorio e con disponibilita sempre aggiornata.</p>
            <p>Copy chiaro e riepilogo sempre visibile per ridurre errori e abbandoni durante il flusso.</p>
            <p>Conferma finale ordinata, con prossime azioni immediate e gestione autonoma dell&apos;appuntamento.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyAppointmentsTab({ slug }: { slug: string }) {
  const { token, nome, isAuthenticated, login, logout } = useClientAuth(slug);
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appuntamento | null>(null);

  const { data: appointments = [], isLoading } = useQuery<Appuntamento[]>({
    queryKey: ['client-appointments', slug, token],
    queryFn: () =>
      fetch(`${API}/public/${slug}/client/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (r.status === 401) {
          logout();
          return [];
        }
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
      queryClient.invalidateQueries({ queryKey: ['client-appointments', slug] });
      setAppointmentToCancel(null);
    },
  });

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(phone);
    } catch (error: unknown) {
      setLoginError(
        (error as { error?: string })?.error ??
          'Numero non riconosciuto. Inserisci lo stesso contatto usato per prenotare.'
      );
    } finally {
      setLoginLoading(false);
    }
  }

  const { upcomingAppointments, historyAppointments } = useMemo(() => {
    const now = new Date();
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime()
    );

    return {
      upcomingAppointments: sorted.filter(
        (appointment) =>
          new Date(appointment.inizio) >= now &&
          ['pending', 'confirmed'].includes(appointment.stato)
      ),
      historyAppointments: [...sorted]
        .filter(
          (appointment) =>
            new Date(appointment.inizio) < now ||
            ['done', 'noshow', 'cancelled'].includes(appointment.stato)
        )
        .reverse(),
    };
  }, [appointments]);

  function AppointmentCard({
    appointment,
    showCancelAction,
  }: {
    appointment: Appuntamento;
    showCancelAction: boolean;
  }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-slate-950">{appointment.servizio?.nome}</div>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {CLIENT_STATUS_LABELS[appointment.stato]}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-500">{appointment.staff?.nome}</div>
            <div className="mt-2 text-sm font-medium text-brand-700">
              {format(parseISO(appointment.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
            </div>
            <div className="mt-1 text-sm text-slate-600">Importo previsto: EUR {appointment.importo}</div>
          </div>
          {showCancelAction ? (
            <button
              onClick={() => setAppointmentToCancel(appointment)}
              disabled={cancelMutation.isPending}
              className="btn-secondary border-red-200 text-red-600 hover:bg-red-50"
            >
              Cancella prenotazione
            </button>
          ) : (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Appuntamento archiviato nello storico
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="surface-panel p-6 sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Recupero prenotazioni</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Rivedi o cancella i tuoi appuntamenti</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Inserisci il numero di telefono usato durante la prenotazione. Non serve un account: usiamo quel contatto per ritrovare appuntamenti in programma e storico recente.
        </p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Numero di telefono</label>
            <input
              className="input"
              type="tel"
              placeholder="+39 333 1234567"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </div>
          {loginError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loginError}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loginLoading}>
            {loginLoading ? 'Ricerca in corso...' : 'Vedi le mie prenotazioni'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="surface-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Area cliente</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Ciao, {nome}</h2>
            <p className="mt-1 text-sm leading-7 text-slate-600">
              Qui trovi prenotazioni in programma e storico recente, cosi hai sempre un quadro chiaro dei tuoi appuntamenti.
            </p>
          </div>
          <button onClick={logout} className="btn-secondary">
            Esci
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-2xl bg-slate-50 py-6 text-center text-sm text-slate-500">Caricamento delle prenotazioni...</div>
        ) : appointments.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Nessuna prenotazione trovata. Se vuoi, puoi tornare alla tab di booking e fissarne una nuova in pochi passaggi.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">In programma</h3>
                <span className="text-sm text-slate-500">{upcomingAppointments.length} appuntamenti</span>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  Nessun appuntamento futuro in programma.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} showCancelAction />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Storico</h3>
                <span className="text-sm text-slate-500">{historyAppointments.length} appuntamenti</span>
              </div>
              {historyAppointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  Lo storico comparira qui dopo i primi appuntamenti completati o cancellati.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} showCancelAction={false} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {appointmentToCancel && (
        <Modal title="Conferma cancellazione" onClose={() => setAppointmentToCancel(null)} size="sm">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Stai per cancellare l&apos;appuntamento per <strong className="text-slate-900">{appointmentToCancel.servizio?.nome}</strong>.
            </p>
            <p>
              {format(parseISO(appointmentToCancel.inizio), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setAppointmentToCancel(null)} className="btn-secondary flex-1">
                Mantieni
              </button>
              <button
                type="button"
                onClick={() => cancelMutation.mutate(appointmentToCancel.id)}
                className="btn-danger flex-1"
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancellazione...' : 'Conferma'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function ClientPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<'prenota' | 'miei'>('prenota');

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#1f1408_0%,_#3d2912_24%,_#f4efe6_24%,_#f4efe6_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-900 shadow-lg shadow-black/10">
              BF
            </div>
            <div>
              <div className="text-lg font-semibold text-white">BarberFlow</div>
            </div>
          </Link>
          <Link to="/admin/login" className="btn-secondary border-white/15 bg-white/10 text-white hover:bg-white/15">
            Dashboard admin
          </Link>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.34fr_1.06fr]">
          <section className="rounded-[32px] bg-[linear-gradient(180deg,_rgba(31,20,8,0.96)_0%,_rgba(61,41,18,0.92)_100%)] px-5 py-6 text-white shadow-xl shadow-black/10">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              Prenotazione cliente
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight">
              Prenota senza account.
            </h1>
            <div className="mt-6 space-y-3 text-sm text-white/80">
              <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">Servizio, professionista, data e conferma</div>
              <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">Disponibilita aggiornata e storico appuntamenti</div>
            </div>
          </section>

          <section className="pb-10">
            <div className="mb-4 flex rounded-3xl border border-white/70 bg-white p-2 shadow-lg shadow-brand-900/10">
              <button
                onClick={() => setActiveTab('prenota')}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'prenota' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Prenota
              </button>
              <button
                onClick={() => setActiveTab('miei')}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'miei' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Le mie prenotazioni
              </button>
            </div>

            {activeTab === 'prenota' ? (
              <BookingTab slug={slug!} onBooked={() => setActiveTab('miei')} />
            ) : (
              <MyAppointmentsTab slug={slug!} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
