# BarberFlow

**BarberFlow** è un sistema di prenotazione online per barbieri. Permette ai clienti di prenotare in autonomia, e al barbiere di gestire l'agenda, i clienti e i servizi da una dashboard dedicata.

---

## Come funziona

### Per i clienti

Accedi alla pagina del tuo barbiere (es. `https://barberflow.it/barbershop-napoli`) e:

1. **Prenota** — scegli il servizio, il barbiere, il giorno e l'orario disponibile
2. **Inserisci nome e numero di telefono** per confermare
3. **Gestisci le tue prenotazioni** — accedi con il tuo numero di telefono per vedere gli appuntamenti futuri e cancellarli se necessario

Nessuna registrazione richiesta. Basta il numero di telefono.

---

### Per i barbieri (admin)

Accedi alla dashboard da `https://barberflow.it/admin/login` con email e password.

Da qui puoi:

| Sezione | Cosa puoi fare |
|---------|----------------|
| **Agenda** | Visualizza gli appuntamenti del giorno, della settimana o del mese. Esporta in PDF. |
| **Clienti** | Vedi la lista clienti, cerca, consulta lo storico visite, elimina profili. |
| **Staff** | Aggiungi o gestisci i barbieri, imposta gli orari di lavoro. |
| **Servizi** | Crea e aggiorna i servizi offerti (nome, durata, prezzo). |

---

## Accesso demo

| Campo | Valore |
|-------|--------|
| Slug barbershop | `barbershop-napoli` |
| Email admin | `admin@barbershop-napoli.it` |
| Password admin | `admin1234` |

Portale clienti: `/barbershop-napoli`
Dashboard admin: `/admin/login`

---

## Installazione (per sviluppatori)

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

API disponibile su `http://localhost:3000`, frontend su `http://localhost:5173`.

### Avvio locale (sviluppo)

```bash
# Backend
cd api
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev

# Frontend (in un altro terminale)
cd web
npm install
cp .env.example .env
npm run dev
```

---

## Variabili d'ambiente

Crea `api/.env` partendo da `api/.env.example`. Le principali:

```env
DATABASE_URL           # PostgreSQL connection string
JWT_SECRET             # Chiave segreta token di accesso
JWT_REFRESH_SECRET     # Chiave segreta refresh token
STRIPE_SECRET_KEY      # (opzionale) Pagamenti online con Stripe
TWILIO_ACCOUNT_SID     # (opzionale) Notifiche SMS con Twilio
RESEND_API_KEY         # (opzionale) Notifiche email con Resend
FRONTEND_URL           # URL del frontend (per CORS)
```

---

## Stack tecnico

| Layer | Tecnologia |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Frontend | React 18 + Vite + TailwindCSS |
| Auth | JWT (access 15min + refresh 7gg) |
| Pagamenti | Stripe |
| SMS | Twilio |
| Email | Resend |
| Deploy | Render.com |

---

## Struttura del progetto

```
barberflow/
├── api/                  # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── routes/       # Endpoint REST
│   │   ├── controllers/  # Logica delle richieste
│   │   ├── services/     # Business logic
│   │   └── middleware/   # Auth, tenant guard, error handler
│   └── prisma/           # Schema DB e migrazioni
└── web/                  # Frontend (React + Vite)
    └── src/
        ├── pages/        # Pagine (portale clienti, dashboard, agenda...)
        ├── components/   # Componenti UI riutilizzabili
        ├── api/          # Client HTTP con gestione token JWT
        └── hooks/        # Hook React custom
```
