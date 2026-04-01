import prisma from '../utils/prisma';
import { processNotification } from '../services/notificationService';
import { logger } from '../utils/logger';

export async function processNotificationsJob(): Promise<void> {
  const pending = await prisma.notifica.findMany({
    where: {
      stato: 'pending',
      schedulataAt: { lte: new Date() },
    },
    select: { id: true },
    take: 100,
  });

  if (pending.length === 0) return;

  logger.info(`Processing ${pending.length} pending notifications`);

  await Promise.allSettled(pending.map((n) => processNotification(n.id)));
}
