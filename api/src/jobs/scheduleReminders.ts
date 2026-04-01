import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export async function scheduleReminders24hJob(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const appointments = await prisma.appuntamento.findMany({
    where: {
      stato: { in: ['pending', 'confirmed'] },
      inizio: { gte: tomorrow, lt: dayAfter },
    },
    include: { cliente: true },
  });

  let created = 0;
  for (const app of appointments) {
    const exists = await prisma.notifica.findFirst({
      where: {
        appuntamentoId: app.id,
        tipo: 'reminder_24h',
      },
    });
    if (exists) continue;

    const cliente = app.cliente;
    const schedulataAt = new Date(app.inizio.getTime() - 24 * 60 * 60 * 1000);

    const toCreate: { canale: 'sms' | 'email' }[] = [];
    if (cliente.telefono) toCreate.push({ canale: 'sms' });
    if (cliente.email) toCreate.push({ canale: 'email' });

    await prisma.notifica.createMany({
      data: toCreate.map((c) => ({
        appuntamentoId: app.id,
        clienteId: cliente.id,
        canale: c.canale,
        tipo: 'reminder_24h' as const,
        schedulataAt,
      })),
    });
    created++;
  }

  logger.info(`Scheduled ${created} reminder_24h notifications`);
}
