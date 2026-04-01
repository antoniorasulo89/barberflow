---
name: BarberFlow Project
description: SaaS multi-tenant gestione appuntamenti barbieri — architettura, stack, stato implementazione
type: project
---

Stack: Node.js + Express + TypeScript (API) / React + Vite + TailwindCSS (frontend) / PostgreSQL + Prisma / Docker Compose.

Tutto implementato e compilato senza errori (TSC + Vite build OK).

**Why:** Progetto completo SaaS dalla richiesta utente.

**How to apply:** Per continuare lo sviluppo: setup con `cp api/.env.example api/.env`, poi `docker-compose up -d`, poi `npx prisma migrate dev` e `npm run db:seed` dalla directory api. Credenziali seed: slug=barbershop-napoli, email=admin@barbershop-napoli.it, password=admin1234.

Nota: la npm cache di sistema aveva file root-owned — risolvere con `sudo chown -R 501:20 ~/.npm` in terminale.
