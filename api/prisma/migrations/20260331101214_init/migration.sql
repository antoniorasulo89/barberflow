-- CreateEnum
CREATE TYPE "StatoAppuntamento" AS ENUM ('pending', 'confirmed', 'done', 'noshow', 'cancelled');

-- CreateEnum
CREATE TYPE "TipoPagamento" AS ENUM ('acconto', 'saldo');

-- CreateEnum
CREATE TYPE "CanalNotifica" AS ENUM ('sms', 'email', 'push');

-- CreateEnum
CREATE TYPE "TipoNotifica" AS ENUM ('conferma', 'reminder_24h', 'reminder_1h', 'cancellazione');

-- CreateEnum
CREATE TYPE "StatoNotifica" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "piano" TEXT NOT NULL DEFAULT 'free',
    "telefono" TEXT,
    "indirizzo" TEXT,
    "accontoRichiesto" BOOLEAN NOT NULL DEFAULT false,
    "accontoPerc" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ruolo" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ruolo" TEXT NOT NULL DEFAULT 'barbiere',
    "telefono" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servizi" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "durata_min" INTEGER NOT NULL,
    "prezzo" DOUBLE PRECISION NOT NULL,
    "attivo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servizi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clienti" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "tag" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visite_totali" INTEGER NOT NULL DEFAULT 0,
    "valore_totale" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultima_visita" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clienti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appuntamenti" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "servizio_id" TEXT NOT NULL,
    "inizio" TIMESTAMP(3) NOT NULL,
    "fine" TIMESTAMP(3) NOT NULL,
    "stato" "StatoAppuntamento" NOT NULL DEFAULT 'pending',
    "importo" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appuntamenti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamenti" (
    "id" TEXT NOT NULL,
    "appuntamento_id" TEXT NOT NULL,
    "stripe_payment_id" TEXT,
    "importo" DOUBLE PRECISION NOT NULL,
    "tipo" "TipoPagamento" NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'pending',
    "pagato_at" TIMESTAMP(3),

    CONSTRAINT "pagamenti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifiche" (
    "id" TEXT NOT NULL,
    "appuntamento_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "canale" "CanalNotifica" NOT NULL,
    "tipo" "TipoNotifica" NOT NULL,
    "stato" "StatoNotifica" NOT NULL DEFAULT 'pending',
    "schedulata_at" TIMESTAMP(3) NOT NULL,
    "inviata_at" TIMESTAMP(3),

    CONSTRAINT "notifiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilita" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "giorno_settimana" INTEGER NOT NULL,
    "ora_inizio" TEXT NOT NULL,
    "ora_fine" TEXT NOT NULL,
    "attivo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "disponibilita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clienti_preferenze" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "tag" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clienti_preferenze_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servizi" ADD CONSTRAINT "servizi_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clienti" ADD CONSTRAINT "clienti_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appuntamenti" ADD CONSTRAINT "appuntamenti_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appuntamenti" ADD CONSTRAINT "appuntamenti_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clienti"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appuntamenti" ADD CONSTRAINT "appuntamenti_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appuntamenti" ADD CONSTRAINT "appuntamenti_servizio_id_fkey" FOREIGN KEY ("servizio_id") REFERENCES "servizi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamenti" ADD CONSTRAINT "pagamenti_appuntamento_id_fkey" FOREIGN KEY ("appuntamento_id") REFERENCES "appuntamenti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifiche" ADD CONSTRAINT "notifiche_appuntamento_id_fkey" FOREIGN KEY ("appuntamento_id") REFERENCES "appuntamenti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifiche" ADD CONSTRAINT "notifiche_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clienti"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilita" ADD CONSTRAINT "disponibilita_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clienti_preferenze" ADD CONSTRAINT "clienti_preferenze_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clienti"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clienti_preferenze" ADD CONSTRAINT "clienti_preferenze_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
