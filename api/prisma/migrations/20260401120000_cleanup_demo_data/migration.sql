-- Delete all appointments (cascades to pagamenti and notifiche)
DELETE FROM "appuntamenti";

-- Delete demo clients — keep only "tarallo" and "vincenzo volta"
DELETE FROM "clienti"
WHERE LOWER(nome) NOT LIKE '%tarallo%'
  AND LOWER(nome) NOT LIKE '%vincenzo volta%';
