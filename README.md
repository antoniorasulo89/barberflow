# BarberFlow

**BarberFlow** e una piattaforma di prenotazione e gestione appuntamenti per barber shop. Include un portale cliente mobile-first e una dashboard admin per agenda, clienti, staff e servizi.

## Stato del prodotto

BarberFlow oggi e un MVP avanzato, adatto a:

- demo commerciali
- pilot con clienti reali
- closed beta seguita manualmente

Non e ancora un SaaS self-serve completo: signup autonomo, reset password e pagamenti richiedono ancora lavoro dedicato.

## Funzionalita principali

### Lato cliente

- prenotazione guidata in pochi passaggi
- nessuna registrazione obbligatoria
- riepilogo live durante il booking
- storico e appuntamenti futuri nel portale cliente
- cancellazione autonoma degli appuntamenti futuri
- disponibilita filtrata in base al servizio e al professionista selezionato

### Lato admin

- agenda giorno, settimana e mese
- KPI rapidi in agenda
- vista mobile dell'agenda con raggruppamento per giorno o per staff
- filtro agenda per professionista
- gestione clienti e dettaglio scheda cliente
- gestione servizi con modifica di nome, durata, prezzo e stato
- gestione staff con disponibilita settimanale
- assegnazione servizi per membro dello staff
- export PDF dell'agenda

## Regole di business gia supportate

- non tutto lo staff puo eseguire tutti i servizi
- il booking cliente mostra solo i professionisti compatibili con il servizio scelto
- la disponibilita viene calcolata solo per staff abilitato a quel servizio
- l'admin non puo creare appuntamenti incoerenti tra staff e servizio
- le notifiche di prenotazione sono agganciate alla pipeline interna esistente

## Demo locale

Credenziali demo admin:

- slug/workspace: `barbershop-napoli`
- email: `admin@barbershop-napoli.it`
- password: `admin1234`

Percorsi utili:

- landing: `/`
- portale cliente demo: `/barbershop-napoli`
- login admin: `/admin/login`

## Prerequisiti

- Node.js 20+
- PostgreSQL 16+ oppure Docker
- Redis 7+ oppure Docker

## Avvio rapido con Docker

Il modo piu veloce per provare BarberFlow in locale e avviare database e Redis con Docker, e frontend/backend in sviluppo locale.

1. Crea i file env:

```powershell
Copy-Item api/.env.example api/.env
Copy-Item web/.env.example web/.env
```

2. Avvia Postgres e Redis:

```powershell
docker compose up -d db redis
```

3. Prepara il database:

```powershell
cd api
npm install
npx prisma db push
npm run db:seed
```

4. Avvia backend e frontend in due terminali separati:

```powershell
cd api
npm run dev
```

```powershell
cd web
npm install
npm run dev -- --host 127.0.0.1
```

Link locali:

- frontend: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- healthcheck API: [http://127.0.0.1:3000/health](http://127.0.0.1:3000/health)

## Avvio full Docker

Se preferisci, puoi anche alzare l'intero stack da `docker-compose.yml`:

```powershell
docker compose up -d
```

Nota: per sviluppo iterativo frontend/backend, l'approccio con `db` e `redis` in Docker e app in locale resta piu comodo.

## Avvio locale senza Docker

Se hai Postgres e Redis gia attivi in locale:

```powershell
cd api
npm install
Copy-Item .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

```powershell
cd web
npm install
Copy-Item .env.example .env
npm run dev
```

## Variabili d'ambiente

### `api/.env`

Variabili principali:

```env
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
FRONTEND_URL
PORT
NODE_ENV
```

Variabili opzionali gia previste nel progetto:

```env
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
RESEND_API_KEY
RESEND_FROM_EMAIL
```

### `web/.env`

```env
VITE_API_URL=http://localhost:3000
```

Se usi il frontend su `127.0.0.1`, conviene allineare anche `FRONTEND_URL` in `api/.env` a `http://127.0.0.1:5173`.

## Script utili

Root:

- `npm run dev:web`
- `npm run dev:api`

Backend:

- `npm run dev`
- `npm run build`
- `npm run db:push`
- `npm run db:seed`

Frontend:

- `npm run dev`
- `npm run build`

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache / queue support | Redis |
| Frontend | React 18 + Vite + Tailwind CSS |
| Data fetching | TanStack Query |
| Auth admin | JWT access + refresh token |
| Email | Resend (opzionale) |
| SMS | Twilio (opzionale) |
| Pagamenti | Stripe (previsto, non ancora completo) |
| Deploy | Render |

## Struttura del progetto

```text
barberflow/
|-- api/
|   |-- prisma/        # schema DB e seed
|   |-- src/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|-- web/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- types/
`-- docker-compose.yml
```

## Limiti attuali

- niente signup self-serve per nuovi saloni
- niente reset password
- pagamenti non ancora completati
- notifiche dipendono dalla configurazione dei provider esterni
- chunk frontend ancora grande in build production
