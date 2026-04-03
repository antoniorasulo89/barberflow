import { Link } from 'react-router-dom';

function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20c0-2.21-2.239-4-5-4s-5 1.79-5 4" />
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 20c0-1.864-1.457-3.448-3.5-3.875M20.5 6.19C21.416 6.832 22 7.848 22 9a4 4 0 01-1.5 3.093" />
    </svg>
  );
}

function IconDeviceMobile() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path strokeLinecap="round" d="M12 18h.01" />
    </svg>
  );
}

const features = [
  {
    icon: <IconClock />,
    title: 'Prenotazione online 24/7',
    description: 'I clienti possono prenotare in qualsiasi momento, senza telefonate e senza passaggi inutili.',
  },
  {
    icon: <IconCalendar />,
    title: 'Agenda professionale',
    description: 'Un calendario chiaro e operativo per controllare disponibilita, appuntamenti e carico giornaliero.',
  },
  {
    icon: <IconUsers />,
    title: 'Gestione clienti',
    description: 'Storico appuntamenti, valore generato e dati essenziali sempre a portata di mano.',
  },
  {
    icon: <IconDeviceMobile />,
    title: 'Esperienza mobile-first',
    description: 'Cliente e admin possono lavorare bene anche da smartphone, senza app da installare.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Scegli il servizio',
    description: 'Il cliente seleziona il trattamento e capisce subito durata e prezzo.',
  },
  {
    number: '2',
    title: 'Seleziona data e ora',
    description: 'Visualizza slot aggiornati in tempo reale e trova subito la disponibilita migliore.',
  },
  {
    number: '3',
    title: 'Conferma in pochi secondi',
    description: 'L appuntamento viene registrato subito, con accesso rapido anche alle prenotazioni future.',
  },
];

const DEFAULT_SLUG = import.meta.env.VITE_SLUG ?? 'barbershop-napoli';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6efe5] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">BF</div>
            <span className="text-lg font-semibold tracking-tight">BarberFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/${DEFAULT_SLUG}`} className="btn-secondary hidden sm:inline-flex">
              Prova il flusso cliente
            </Link>
            <Link to="/admin/login" className="btn-primary">
              Accedi
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-[radial-gradient(circle_at_top_left,_rgba(217,124,18,0.18),_transparent_35%),linear-gradient(180deg,_#fffaf3_0%,_#f7efdf_100%)] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-10">
          <span className="inline-block rounded-full border border-brand-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Software per prenotazioni e gestione barber shop
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Prenotazioni online e agenda operativa per il tuo barber shop.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Meno telefonate, meno carta, meno attesa. Clienti, staff e agenda in un unico strumento.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/${DEFAULT_SLUG}`} className="btn-primary px-7 py-3 text-base">
              Prova la demo prenotazione
            </Link>
            <Link to="/admin/login" className="btn-secondary px-7 py-3 text-base">
              Apri la dashboard admin
            </Link>
          </div>
        </div>
      </section>

      <section className="py-18 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Tutto quello che serve, niente di superfluo</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="card flex flex-col gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
              'Dati isolati per ogni salone',
              'Nessuna installazione richiesta',
              'Disponibilità in tempo reale',
              'Notifiche automatiche ai clienti',
              'Accesso da qualsiasi dispositivo',
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="h-4 w-4 flex-shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Prezzi semplici, nessuna sorpresa</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
              Nessun contratto, nessun costo nascosto.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: 'Gratis',
                sub: 'Per sempre',
                features: ['1 barbiere', 'Prenotazioni illimitate', 'Portale clienti', 'Dashboard admin'],
                cta: 'Inizia gratis',
                href: '/admin/login',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '€ 29',
                sub: 'al mese',
                features: ['Fino a 5 barbieri', 'Notifiche SMS ed email', 'Esportazione PDF', 'Statistiche clienti avanzate'],
                cta: 'Inizia la prova',
                href: '/admin/login',
                highlight: true,
              },
              {
                name: 'Business',
                price: 'Su misura',
                sub: 'Contattaci',
                features: ['Barbieri illimitati', 'Multi-sede', 'Onboarding dedicato', 'SLA garantito'],
                cta: 'Parliamone',
                href: '/admin/login',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? 'border-brand-400 bg-brand-500 text-white shadow-xl shadow-brand-900/15'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-4">
                  <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${plan.highlight ? 'text-white/70' : 'text-brand-600'}`}>
                    {plan.name}
                  </div>
                  <div className={`mt-2 text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-950'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-slate-500'}`}>{plan.sub}</div>
                </div>
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white/90' : 'text-slate-600'}`}>
                      <svg className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-brand-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-brand-600 hover:bg-brand-50'
                      : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f7f3eb] py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Come funziona</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {index < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-[calc(100%-4rem)] bg-brand-100 sm:block" />
                )}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold text-white shadow-md">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-10">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pronto da usare da oggi.
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/${DEFAULT_SLUG}`} className="btn-primary px-7 py-3 text-base">
              Vedi il portale cliente
            </Link>
            <Link to="/admin/login" className="btn-secondary border-white/15 bg-white/10 px-7 py-3 text-base text-white hover:bg-white/15">
              Accedi alla dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
