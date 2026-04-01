-- ===== Clean duplicate staff =====
-- Reassign appuntamenti from duplicate staff to canonical (MIN id)
WITH canonical_staff AS (
  SELECT tenant_id, nome, MIN(id) AS canonical_id
  FROM "staff"
  GROUP BY tenant_id, nome
),
duplicate_staff AS (
  SELECT s.id AS dup_id, c.canonical_id
  FROM "staff" s
  JOIN canonical_staff c ON s.tenant_id = c.tenant_id AND s.nome = c.nome
  WHERE s.id != c.canonical_id
)
UPDATE "appuntamenti"
SET staff_id = d.canonical_id
FROM duplicate_staff d
WHERE staff_id = d.dup_id;

-- Reassign clienti_preferenze from duplicate staff to canonical
WITH canonical_staff AS (
  SELECT tenant_id, nome, MIN(id) AS canonical_id
  FROM "staff"
  GROUP BY tenant_id, nome
),
duplicate_staff AS (
  SELECT s.id AS dup_id, c.canonical_id
  FROM "staff" s
  JOIN canonical_staff c ON s.tenant_id = c.tenant_id AND s.nome = c.nome
  WHERE s.id != c.canonical_id
)
UPDATE "clienti_preferenze"
SET staff_id = d.canonical_id
FROM duplicate_staff d
WHERE staff_id = d.dup_id;

-- Delete duplicate staff (disponibilita cascade-deletes automatically)
DELETE FROM "staff"
WHERE id IN (
  SELECT s.id FROM "staff" s
  WHERE s.id != (
    SELECT MIN(s2.id) FROM "staff" s2
    WHERE s2.tenant_id = s.tenant_id AND s2.nome = s.nome
  )
);

-- ===== Clean duplicate servizi =====
-- Reassign appuntamenti from duplicate servizi to canonical
WITH canonical_servizi AS (
  SELECT tenant_id, nome, MIN(id) AS canonical_id
  FROM "servizi"
  GROUP BY tenant_id, nome
),
duplicate_servizi AS (
  SELECT sv.id AS dup_id, c.canonical_id
  FROM "servizi" sv
  JOIN canonical_servizi c ON sv.tenant_id = c.tenant_id AND sv.nome = c.nome
  WHERE sv.id != c.canonical_id
)
UPDATE "appuntamenti"
SET servizio_id = d.canonical_id
FROM duplicate_servizi d
WHERE servizio_id = d.dup_id;

-- Delete duplicate servizi
DELETE FROM "servizi"
WHERE id IN (
  SELECT sv.id FROM "servizi" sv
  WHERE sv.id != (
    SELECT MIN(sv2.id) FROM "servizi" sv2
    WHERE sv2.tenant_id = sv.tenant_id AND sv2.nome = sv.nome
  )
);

-- ===== Add unique constraints =====
ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_nome_key" UNIQUE ("tenant_id", "nome");
ALTER TABLE "servizi" ADD CONSTRAINT "servizi_tenant_id_nome_key" UNIQUE ("tenant_id", "nome");
