import { Link } from 'react-router-dom';

const DEFAULT_SLUG = import.meta.env.VITE_SLUG ?? 'barbershop-napoli';

const productHighlights = [
  {
    title: 'Prenotazioni in meno di un minuto',
    description: 'Il cliente sceglie servizio, professionista, data e conferma senza creare un account.',
  },
  {
    title: 'Gestione operativa in tempo reale',
    description: 'Agenda, clienti, staff e servizi convivono in una dashboard semplice da usare ogni giorno.',
  },
  {
    title: 'Esperienza pensata per mobile',
    description: 'Il flusso cliente resta veloce su smartphone e il gestionale rimane leggibile anche in mobilita.',
  },
];

const trustItems = [
  'Disponibilita aggiornata in tempo reale',
  'Gestione autonoma delle prenotazioni',
  'Setup rapido per nuovi saloni',
];

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[#f6efe5] text-slate-900">
      <section className="relative overflow-hidden border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(217,124,18,0.18),_transparent_35%),linear-gradient(180deg,_#fffaf3_0%,_#f7efdf_100%)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-8 lg:px-10 lg:py-10">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white shadow-lg shadow-brand-500/20">
                BF
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">BarberFlow</div>
                <div className="text-sm text-slate-600">Booking e gestione agenda per barber shop moderni</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/admin/login" className="btn-secondary border-white/80 bg-white/80 backdrop-blur">
                Area admin
              </Link>
              <Link to={`/${DEFAULT_SLUG}`} className="btn-primary">
                Prova il flusso cliente
              </Link>
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center rounded-full border border-brand-200 bg-white/75 px-4 py-1.5 text-sm font-medium text-brand-800">
                Prodotto SaaS per prenotazioni, agenda e clienti
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                BarberFlow rende la prenotazione semplice per i clienti e l&apos;operativita chiara per il team.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Un&apos;esperienza unica per fissare appuntamenti, gestire disponibilita e tenere sotto controllo il lavoro quotidiano senza attriti inutili.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={`/${DEFAULT_SLUG}`} className="btn-primary px-6 py-3">
                  Apri esperienza cliente
                </Link>
                <Link to="/admin/login" className="btn-secondary px-6 py-3">
                  Entra nella dashboard
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {trustItems.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-black/5">
                    <span className="text-brand-600">•</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-2xl shadow-brand-900/10 backdrop-blur">
              <div className="rounded-[22px] bg-slate-950 p-6 text-white">
                <div className="text-sm uppercase tracking-[0.2em] text-white/60">Preview esperienza</div>
                <div className="mt-3 text-2xl font-semibold">Prenotazioni chiare, senza account obbligatorio</div>
                <div className="mt-6 grid gap-3">
                  {[
                    'Scegli il servizio e confronta durata e prezzo',
                    'Seleziona staff, data e disponibilita aggiornata',
                    'Conferma e gestisci gli appuntamenti in autonomia',
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="text-sm leading-6 text-white/85">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="mb-8 max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Percezione di prodotto</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Un&apos;esperienza che comunica ordine, affidabilita e velocita.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {productHighlights.map((item) => (
            <article key={item.title} className="rounded-[24px] border border-black/5 bg-white p-6 shadow-sm shadow-brand-900/5">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
