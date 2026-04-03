-- CreateTable
CREATE TABLE "staff_servizi" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "servizio_id" TEXT NOT NULL,

    CONSTRAINT "staff_servizi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_servizi_staff_id_servizio_id_key" ON "staff_servizi"("staff_id", "servizio_id");

-- AddForeignKey
ALTER TABLE "staff_servizi" ADD CONSTRAINT "staff_servizi_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_servizi" ADD CONSTRAINT "staff_servizi_servizio_id_fkey" FOREIGN KEY ("servizio_id") REFERENCES "servizi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
