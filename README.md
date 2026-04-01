# BarberFlow

SaaS multi-tenant per la gestione appuntamenti di barbieri.

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access 15min + refresh 7gg) |
| Pagamenti | Stripe |
| SMS | Twilio |
| Email | Resend |
| Jobs | node-cron |
| Frontend | React + Vite + TailwindCSS |
| Deploy | Docker Compose |

## Struttura

```
barberflow/
├── api/                     # Backend Express
│   ├── src/
│   │   ├── routes/          # Router Express
│   │   ├── controllers/     # Handler HTTP
│   │   ├── services/        # Business logic
│   │   ├── middleware/       # auth, tenantGuard, errorHandler
│   │   ├── jobs/            # Cron jobs
│   │   └── utils/           # prisma, logger, errors
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── web/                     # Frontend React
│   └── src/
│       ├── pages/           # Dashboard, Agenda, Clients, Booking
│       ├── components/      # UI components
│       ├── api/             # Axios client con JWT interceptors
│       └── hooks/
└── docker-compose.yml
```

## Setup rapido (Docker)

```bash
# 1. Copia le variabili d'ambiente
cp api/.env.example api/.env
# Edita api/.env con le tue credenziali Stripe, Twilio, Resend

# 2. Avvia tutto
docker-compose up -d

# 3. Esegui migration e seed
docker-compose exec api npx prisma migrate dev
docker-compose exec api npm run db:seed
```

L'API sarà su `http://localhost:3000`, il frontend su `http://localhost:5173`.

## Setup locale (sviluppo)

### Prerequisiti

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend

```bash
cd api
npm install
cp .env.example .env
# Edita .env

npx prisma migrate dev
npm run db:seed
npm run dev
```

### Frontend

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

## Credenziali seed

Dopo `npm run db:seed`:

| Campo | Valore |
|-------|--------|
| Slug | `barbershop-napoli` |
| Email | `admin@barbershop-napoli.it` |
| Password | `admin1234` |

## API principali

### Auth

```
POST /auth/register   { nome, slug, email, password }
POST /auth/login      { slug, email, password }
POST /auth/refresh    { refreshToken }
POST /auth/logout     { refreshToken }
```

### Appuntamenti

```
GET    /appointments?data=YYYY-MM-DD&staffId=&stato=
POST   /appointments   { clienteId, staffId, servizioId, inizio, note? }
PATCH  /appointments/:id  { stato?, inizio?, note? }
DELETE /appointments/:id
```

### Slot disponibili

```
GET /availability?staffId=&date=YYYY-MM-DD&serviceId=
→ [{ inizio, fine, disponibile }]
```

### Clienti

```
GET    /clients?search=&sort=visite|valore|recenti|nome&tag=
POST   /clients
GET    /clients/:id
PATCH  /clients/:id
GET    /clients/:id/stats
```

### Staff

```
GET  /staff
POST /staff
GET  /staff/:id/schedule
PUT  /staff/:id/schedule
```

### Servizi

```
GET   /services
POST  /services
PATCH /services/:id
```

### Pagamenti

```
POST /payments/create-intent  { appuntamentoId }
POST /payments/webhook        (Stripe webhook)
```

## Cron Jobs

| Job | Schedule | Azione |
|-----|----------|--------|
| processNotifications | ogni 5 min | Invia notifiche `pending` con `schedulata_at <= now` |
| scheduleReminders24h | 08:00 ogni giorno | Crea reminder 24h per gli appuntamenti del giorno dopo |
| markNoshow | 23:00 ogni giorno | Segna come `noshow` gli appuntamenti `confirmed` scaduti |

## Variabili d'ambiente

Vedi `api/.env.example` per la lista completa:

```env
DATABASE_URL        # PostgreSQL connection string
REDIS_URL           # Redis connection string
JWT_SECRET          # Chiave segreta access token
JWT_REFRESH_SECRET  # Chiave segreta refresh token
STRIPE_SECRET_KEY   # Chiave segreta Stripe
STRIPE_WEBHOOK_SECRET  # Webhook secret Stripe
TWILIO_ACCOUNT_SID  # Account SID Twilio
TWILIO_AUTH_TOKEN   # Auth token Twilio
TWILIO_PHONE_NUMBER # Numero mittente SMS
RESEND_API_KEY      # API key Resend
RESEND_FROM_EMAIL   # Indirizzo mittente email
PORT                # Porta API (default 3000)
FRONTEND_URL        # URL frontend per CORS
```

## Sicurezza

- **Tenant isolation**: ogni query filtra per `tenantId` estratto dal JWT
- **Rate limiting**: 300 req/15min per IP
- **Helmet**: headers di sicurezza HTTP
- **Bcrypt**: password hashed con cost factor 12
- **Zod**: validazione input su ogni endpoint
- **Stripe webhook**: signature verification prima di processare eventi
