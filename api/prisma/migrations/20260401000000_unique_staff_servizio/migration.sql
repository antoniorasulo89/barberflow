-- AddUniqueConstraint: staff(tenant_id, nome)
ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_nome_key" UNIQUE ("tenant_id", "nome");

-- AddUniqueConstraint: servizi(tenant_id, nome)
ALTER TABLE "servizi" ADD CONSTRAINT "servizi_tenant_id_nome_key" UNIQUE ("tenant_id", "nome");
