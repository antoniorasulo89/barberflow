import { Link } from 'react-router-dom';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20c0-2.21-2.239-4-5-4s-5 1.79-5 4" />
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 20c0-1.864-1.457-3.448-3.5-3.875M20.5 6.19C21.416 6.832 22 7.848 22 9a4 4 0 01-1.5 3.093" />
    </svg>
  );
}

function IconDeviceMobile() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path strokeLinecap="round" d="M12 18h.01" />
    </svg>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <IconClock />,
    title: 'Prenotazione online 24/7',
    description:
      'I tuoi clienti possono prenotare in qualsiasi momento, anche a tarda notte, senza telefonate.',
  },
  {
    icon: <IconCalendar />,
    title: 'Agenda professionale',
    description:
      'Visualizza e gestisci tutti gli appuntamenti in un calendario chiaro, con aggiornamenti in tempo reale.',
  },
  {
    icon: <IconUsers />,
    title: 'Gestione clienti',
    description:
      'Storico appuntamenti, preferenze e note per ogni cliente, sempre a portata di mano.',
  },
  {
    icon: <IconDeviceMobile />,
    title: 'Nessuna app richiesta',
    description:
      'Tutto via browser. I clienti prenotano dal link del tuo salone, senza scaricare nulla.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Scegli il servizio',
    description: 'Il cliente seleziona il trattamento desiderato dal menu del tuo salone.',
  },
  {
    number: '2',
    title: 'Seleziona data e ora',
    description: 'Sceglie il giorno e la fascia oraria disponibile direttamente sul calendario.',
  },
  {
    number: '3',
    title: 'Conferma in un click',
    description: "L'appuntamento viene confermato istantaneamente, senza telefonate o attese.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 text-white font-bold text-sm">B</span>
            <span className="text-lg font-bold tracking-tight text-gray-900">BarberFlow</span>
          </div>

          {/* Right actions */}
          <Link to="/admin/login" className="btn-secondary text-sm px-4 py-1.5">
            Accedi
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-white py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold tracking-wide uppercase">
            Software per barbieri
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Prenotazioni online
            <br />
            <span className="text-brand-500">senza pensieri</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            BarberFlow trasforma il tuo salone con un sistema di prenotazione digitale semplice,
            professionale e pronto in pochi minuti. Zero app, zero complicazioni.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/barbershop-napoli"
              className="btn-primary px-7 py-3 text-base font-semibold shadow-md"
            >
              Prova la demo prenotazione
            </Link>
            <Link
              to="/admin/login"
              className="btn-secondary px-7 py-3 text-base font-semibold"
            >
              Accedi al pannello admin
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tutto ciò di cui hai bisogno</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Strumenti pensati per il lavoro quotidiano del barbiere, senza inutili complessità.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-500">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Come funziona ── */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Come funziona</h2>
            <p className="text-gray-500">Tre passi e l'appuntamento è fatto.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex flex-col items-center text-center relative">
                {/* Connector line between steps (hidden on mobile) */}
                {idx < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-brand-100" />
                )}
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-brand-500 text-white font-bold text-lg mb-4 shadow-md">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 bg-brand-500">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Pronto a semplificare il tuo salone?
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            Inizia subito, gratuitamente. Nessuna carta di credito richiesta.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-white text-brand-600 font-bold text-base hover:bg-brand-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white shadow-md"
          >
            Prova BarberFlow gratis
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-brand-500 text-white font-bold text-xs">B</span>
            <span className="font-medium text-gray-600">BarberFlow</span>
          </div>
          <p>&copy; {new Date().getFullYear()} BarberFlow. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
