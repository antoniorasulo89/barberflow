import { PrismaClient, StatoAppuntamento } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function setTime(date: Date, h: number, m: number): Date {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding database...');

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'barbershop-napoli' },
    update: {},
    create: {
      nome: 'Barbershop Napoli',
      slug: 'barbershop-napoli',
      piano: 'pro',
      telefono: '+39 081 1234567',
      indirizzo: 'Via Toledo 123, Napoli',
      accontoRichiesto: false,
    },
  });
  console.log('Tenant ready:', tenant.nome);

  // Admin user
  const passwordHash = await bcrypt.hash('admin1234', 12);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@barbershop-napoli.it' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@barbershop-napoli.it',
      passwordHash,
      nome: 'Admin',
      ruolo: 'admin',
    },
  });

  // Staff — upsert by (tenantId, nome) thanks to @@unique
  const marco = await prisma.staff.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Marco Esposito' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Marco Esposito',
      ruolo: 'barbiere',
      telefono: '+39 333 1111111',
    },
  });

  const luca = await prisma.staff.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Luca Romano' } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'Luca Romano',
      ruolo: 'barbiere',
      telefono: '+39 333 2222222',
    },
  });
  console.log('Staff ready: Marco, Luca');

  // Availability: seed only if not already set for this staff
  const staffIds = [marco.id, luca.id];
  const giorni = [1, 2, 3, 4, 5, 6]; // Monday to Saturday

  for (const staffId of staffIds) {
    const existing = await prisma.disponibilita.count({ where: { staffId } });
    if (existing === 0) {
      for (const giorno of giorni) {
        await prisma.disponibilita.createMany({
          data: [
            { staffId, giornoSettimana: giorno, oraInizio: '09:00', oraFine: '13:00', attivo: true },
            { staffId, giornoSettimana: giorno, oraInizio: '15:00', oraFine: '19:00', attivo: true },
          ],
        });
      }
    }
  }
  console.log('Availability ready');

  // Servizi — upsert by (tenantId, nome)
  const taglio = await prisma.servizio.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Taglio' } },
    update: {},
    create: { tenantId: tenant.id, nome: 'Taglio', durataMini: 30, prezzo: 25 },
  });
  const barba = await prisma.servizio.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Barba' } },
    update: {},
    create: { tenantId: tenant.id, nome: 'Barba', durataMini: 20, prezzo: 18 },
  });
  const taglioBarba = await prisma.servizio.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Taglio + Barba' } },
    update: {},
    create: { tenantId: tenant.id, nome: 'Taglio + Barba', durataMini: 50, prezzo: 38 },
  });
  const colore = await prisma.servizio.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Colore' } },
    update: {},
    create: { tenantId: tenant.id, nome: 'Colore', durataMini: 60, prezzo: 55 },
  });
  console.log('Servizi ready');

  await prisma.staffServizio.createMany({
    data: [
      { staffId: marco.id, servizioId: taglio.id },
      { staffId: marco.id, servizioId: barba.id },
      { staffId: marco.id, servizioId: taglioBarba.id },
      { staffId: luca.id, servizioId: taglio.id },
      { staffId: luca.id, servizioId: taglioBarba.id },
      { staffId: luca.id, servizioId: colore.id },
    ],
    skipDuplicates: true,
  });
  console.log('Staff service assignments ready');

  // Clienti — skip entirely if any already exist for this tenant
  const existingClienti = await prisma.cliente.count({ where: { tenantId: tenant.id } });
  if (existingClienti > 0) {
    console.log('Clienti already seeded, skipping.');
    console.log('\nSeed complete!');
    console.log('Login: admin@barbershop-napoli.it / admin1234');
    console.log('Slug: barbershop-napoli');
    return;
  }

  const clientiData = [
    { nome: 'Antonio Russo', telefono: '+39 347 1000001', email: 'antonio.russo@email.it', tag: ['vip'] },
    { nome: 'Giovanni De Luca', telefono: '+39 347 1000002', email: 'giovanni.deluca@email.it', tag: [] },
    { nome: 'Francesco Marino', telefono: '+39 347 1000003', email: null, tag: ['frequente'] },
    { nome: 'Salvatore Greco', telefono: '+39 347 1000004', email: 'salvatore.greco@email.it', tag: [] },
    { nome: 'Luigi Ferrara', telefono: '+39 347 1000005', email: null, tag: ['barba'] },
    { nome: 'Mario Santoro', telefono: '+39 347 1000006', email: 'mario.santoro@email.it', tag: ['vip', 'frequente'] },
    { nome: 'Roberto Ricci', telefono: '+39 347 1000007', email: null, tag: [] },
    { nome: 'Carmelo Bruno', telefono: '+39 347 1000008', email: 'carmelo.bruno@email.it', tag: [] },
    { nome: 'Pasquale Lombardi', telefono: '+39 347 1000009', email: null, tag: ['colore'] },
    { nome: 'Vincenzo Conti', telefono: '+39 347 1000010', email: 'vincenzo.conti@email.it', tag: [] },
  ];

  const staffList = [marco, luca];
  const staffServices = new Map([
    [marco.id, [taglio, barba, taglioBarba]],
    [luca.id, [taglio, taglioBarba, colore]],
  ]);

  for (const clienteData of clientiData) {
    const cliente = await prisma.cliente.create({
      data: { tenantId: tenant.id, ...clienteData },
    });

    const numAppointments = 4 + Math.floor(Math.random() * 5);
    let visiteTotali = 0;
    let valoreTotale = 0;
    let ultimaVisita: Date | null = null;

    for (let i = 0; i < numAppointments; i++) {
      const daysBack = Math.floor(Math.random() * 90) + 1;
      const appointmentDate = daysAgo(daysBack);
      const hours = [9, 10, 11, 15, 16, 17];
      const hour = hours[Math.floor(Math.random() * hours.length)];
      const staff = staffList[Math.floor(Math.random() * staffList.length)];
      const staffEligibleServices = staffServices.get(staff.id) ?? [taglio];
      const servizio = staffEligibleServices[Math.floor(Math.random() * staffEligibleServices.length)];

      const inizio = setTime(appointmentDate, hour, 0);
      const fine = new Date(inizio.getTime() + servizio.durataMini * 60 * 1000);
      const stato: StatoAppuntamento = daysBack > 0 ? 'done' : 'confirmed';

      try {
        await prisma.appuntamento.create({
          data: {
            tenantId: tenant.id,
            clienteId: cliente.id,
            staffId: staff.id,
            servizioId: servizio.id,
            inizio,
            fine,
            stato,
            importo: servizio.prezzo,
          },
        });

        if (stato === 'done') {
          visiteTotali++;
          valoreTotale += servizio.prezzo;
          if (!ultimaVisita || inizio > ultimaVisita) ultimaVisita = inizio;
        }
      } catch {
        // Skip overlapping appointments
      }
    }

    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { visiteTotali, valoreTotale, ultimaVisita },
    });
  }
  console.log('Clienti and appointments created');

  // Add some future appointments for today/tomorrow
  const clienti = await prisma.cliente.findMany({ where: { tenantId: tenant.id }, take: 4 });
  const today = new Date();

  const futureApps = [
    { cliente: clienti[0], staff: marco, servizio: taglio, h: 10, m: 0 },
    { cliente: clienti[1], staff: marco, servizio: barba, h: 11, m: 0 },
    { cliente: clienti[2], staff: luca, servizio: taglioBarba, h: 15, m: 0 },
    { cliente: clienti[3], staff: luca, servizio: colore, h: 16, m: 0 },
  ];

  for (const app of futureApps) {
    const inizio = setTime(today, app.h, app.m);
    const fine = new Date(inizio.getTime() + app.servizio.durataMini * 60 * 1000);
    await prisma.appuntamento.create({
      data: {
        tenantId: tenant.id,
        clienteId: app.cliente.id,
        staffId: app.staff.id,
        servizioId: app.servizio.id,
        inizio,
        fine,
        stato: 'confirmed',
        importo: app.servizio.prezzo,
      },
    }).catch(() => null);
  }

  console.log('Future appointments created');
  console.log('\nSeed complete!');
  console.log('Login: admin@barbershop-napoli.it / admin1234');
  console.log('Slug: barbershop-napoli');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
