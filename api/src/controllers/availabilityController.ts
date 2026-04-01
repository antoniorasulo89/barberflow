import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getAvailableSlots } from '../services/availabilityService';
import { notFound } from '../utils/errors';
import prisma from '../utils/prisma';

const querySchema = z.object({
  staffId: z.string(),
  date: z.string(),
  serviceId: z.string(),
});

export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { staffId, date, serviceId } = querySchema.parse(req.query);
    const tenantId = req.tenantId!;

    const servizio = await prisma.servizio.findFirst({
      where: { id: serviceId, tenantId, attivo: true },
    });
    if (!servizio) return next(notFound('Servizio'));

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId, attivo: true },
    });
    if (!staff) return next(notFound('Staff'));

    const slots = await getAvailableSlots(tenantId, staffId, date, servizio.durataMini);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}
