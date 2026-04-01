import prisma from '../utils/prisma';

export interface Slot {
  inizio: string;
  fine: string;
  disponibile: boolean;
}

export async function getAvailableSlots(
  tenantId: string,
  staffId: string,
  date: string,
  durationMin: number
): Promise<Slot[]> {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0=Sunday, 6=Saturday

  // 1. Get availability for that day of week
  const disponibilita = await prisma.disponibilita.findMany({
    where: { staffId, giornoSettimana: dayOfWeek, attivo: true },
  });

  if (disponibilita.length === 0) return [];

  // 2. Get existing appointments for staff+date (non-cancelled)
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appuntamento.findMany({
    where: {
      tenantId,
      staffId,
      stato: { notIn: ['cancelled'] },
      inizio: { gte: dayStart, lte: dayEnd },
    },
    select: { inizio: true, fine: true },
  });

  const slots: Slot[] = [];

  // 3. For each availability block, generate slots
  for (const disp of disponibilita) {
    const [startH, startM] = disp.oraInizio.split(':').map(Number);
    const [endH, endM] = disp.oraFine.split(':').map(Number);

    const blockStart = new Date(date);
    blockStart.setHours(startH, startM, 0, 0);

    const blockEnd = new Date(date);
    blockEnd.setHours(endH, endM, 0, 0);

    let current = new Date(blockStart);

    while (current.getTime() + durationMin * 60 * 1000 <= blockEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + durationMin * 60 * 1000);

      // 4. Check overlap with existing appointments
      const overlaps = existingAppointments.some((app) => {
        const appStart = new Date(app.inizio);
        const appEnd = new Date(app.fine);
        return slotStart < appEnd && slotEnd > appStart;
      });

      slots.push({
        inizio: slotStart.toISOString(),
        fine: slotEnd.toISOString(),
        disponibile: !overlaps,
      });

      current = new Date(current.getTime() + durationMin * 60 * 1000);
    }
  }

  return slots;
}
