import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export async function markNoshowJob(): Promise<void> {
  const now = new Date();

  const result = await prisma.appuntamento.updateMany({
    where: {
      stato: 'confirmed',
      fine: { lt: now },
    },
    data: { stato: 'noshow' },
  });

  if (result.count > 0) {
    logger.info(`Marked ${result.count} appointments as noshow`);
  }
}
