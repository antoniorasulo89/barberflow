# BarberFlow

**BarberFlow** è una piattaforma SaaS multi-tenant per la gestione delle prenotazioni nei saloni di barbiere. I clienti prenotano online in autonomia; i titolari gestiscono agenda, staff e clienti da una dashboard dedicata.

---

## Navigazione

| URL | Cosa trovi |
|-----|-----------|
| `/` | Landing page del prodotto |
| `/:slug` | Portale prenotazioni del salone (es. `/barbershop-napoli`) |
| `/admin/login` | Login per i titolari |
| `/admin/agenda` | Dashboard — Agenda |
| `/admin/clients` | Dashboard — Clienti |
| `/admin/staff` | Dashboard — Staff |
| `/admin/services` | Dashboard — Servizi |

---

## Per i clienti

Visita la pagina del salone (es. `https://tuodominio.it/barbershop-napoli`) e:

1. **Prenota** — scegli il servizio, il professionista, la data e l'orario
2. **Conferma** con nome e, opzionalmente, numero di telefono
3. **Gestisci le prenotazioni** — inserisci il numero usato in fase di prenotazione per vedere e cancellare i tuoi appuntamenti

Nessuna registrazione. Nessuna app da installare.

---

## Per i titolari (admin)

Accedi da `/admin/login` con email e password.

| Sezione | Funzionalità |
|---------|-------------|
| **Agenda** | Vista giorno, settimana o mese · Aggiorna stato appuntamenti · Esporta PDF |
| **Clienti** | Lista con ricerca e filtri · Profilo con storico visite · Elimina cliente |
| **Staff** | Gestione profili · Disponibilità settimanale per fascia oraria |
| **Servizi** | Nome, durata, prezzo · Attiva/disattiva |

---

## Accesso demo

| Campo | Valore |
|-------|--------|
| ID salone | `barbershop-napoli` |
| Email | `admin@barbershop-napoli.it` |
| Password | `admin1234` |

---

## Installazione

### Prerequisiti

- Node.js 20+
- PostgreSQL 15+

### Avvio rapido con Docker

```bash
cp api/.env.example api/.env
# Compila api/.env con le tue credenziali

docker-compose up -d
docker-compose exec api npx prisma migrate dev
docker-compose exec api npm run db:seed
```

API su `http://localhost:3000`, frontend su `http://localhost:5173`.

### Avvio locale (sviluppo)

```bash
# Backend
cd api && npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev

# Frontend (altro terminale)
cd web && npm install
cp .env.example .env
npm run dev
```

---

## Variabili d'ambiente

Crea `api/.env` da `api/.env.example`:

```env
DATABASE_URL           # PostgreSQL connection string
JWT_SECRET             # Chiave segreta access token
JWT_REFRESH_SECRET     # Chiave segreta refresh token
CLIENT_JWT_SECRET      # Chiave segreta token clienti (portale)
STRIPE_SECRET_KEY      # (opzionale) Pagamenti con Stripe
TWILIO_ACCOUNT_SID     # (opzionale) SMS con Twilio
RESEND_API_KEY         # (opzionale) Email con Resend
FRONTEND_URL           # URL frontend per CORS
```

Variabile frontend (`web/.env`):

```env
VITE_API_URL=http://localhost:3000/api   # URL del backend
VITE_SLUG=barbershop-napoli              # Slug di default (usato in sviluppo)
```

---

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Backend | Node.js · Express · TypeScript |
| Database | PostgreSQL · Prisma ORM |
| Frontend | React 18 · Vite · TailwindCSS |
| Auth | JWT access (15 min) + refresh (7 gg) · token client (7 gg, solo telefono) |
| Pagamenti | Stripe |
| Notifiche | Twilio (SMS) · Resend (email) |
| Deploy | Render.com |

---

## Struttura del progetto

```
barberflow/
├── api/                        # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── routes/             # public.ts, auth.ts, appointments.ts, ...
│   │   ├── controllers/        # Logica per ogni risorsa
│   │   ├── services/           # Business logic (availability, notifications...)
│   │   └── middleware/         # auth, tenantGuard, errorHandler
│   └── prisma/
│       ├── schema.prisma       # Modelli DB (Tenant, Staff, Servizio, Cliente...)
│       ├── migrations/         # Migrazioni SQL
│       └── seed.ts             # Dati iniziali (idempotente via upsert)
└── web/                        # Frontend (React + Vite)
    └── src/
        ├── pages/              # LandingPage, ClientPortalPage, AgendaPage...
        ├── components/         # Modal, StatusBadge, NewAppointmentModal...
        ├── api/                # Axios client con refresh token automatico
        ├── hooks/              # useAuth, useClientAuth
        └── types/              # TypeScript interfaces
```
