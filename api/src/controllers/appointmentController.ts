import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { notFound, badRequest } from '../utils/errors';
import { scheduleAppointmentNotifications } from '../services/notificationService';
import { sendCancellationNotification } from '../services/notificationService';

const createSchema = z.object({
  clienteId: z.string(),
  staffId: z.string(),
  servizioId: z.string(),
  inizio: z.string().datetime(),
  note: z.string().optional(),
});

const updateSchema = z.object({
  stato: z.enum(['pending', 'confirmed', 'done', 'noshow', 'cancelled']).optional(),
  inizio: z.string().datetime().optional(),
  note: z.string().optional(),
});

const listSchema = z.object({
  data: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  staffId: z.string().optional(),
  stato: z.enum(['pending', 'confirmed', 'done', 'noshow', 'cancelled']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export async function listAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, from, to, staffId, stato, page, limit } = listSchema.parse(req.query);
    const tenantId = req.tenantId!;

    const where: Record<string, unknown> = { tenantId };
    if (staffId) where.staffId = staffId;
    if (stato) where.stato = stato;
    if (data) {
      const day = new Date(data);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.inizio = { gte: day, lt: nextDay };
    } else if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.gte = new Date(from);
      if (to) range.lt = new Date(to);
      where.inizio = range;
    }

    const [items, total] = await Promise.all([
      prisma.appuntamento.findMany({
        where,
        include: {
          cliente: true,
          staff: true,
          servizio: true,
          pagamenti: true,
        },
        orderBy: { inizio: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appuntamento.count({ where }),
    ]);

    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function createAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const tenantId = req.tenantId!;

    const servizio = await prisma.servizio.findFirst({
      where: { id: data.servizioId, tenantId, attivo: true },
    });
    if (!servizio) return next(notFound('Servizio'));

    const staff = await prisma.staff.findFirst({
      where: { id: data.staffId, tenantId, attivo: true },
    });
    if (!staff) return next(notFound('Staff'));

    const cliente = await prisma.cliente.findFirst({
      where: { id: data.clienteId, tenantId },
    });
    if (!cliente) return next(notFound('Cliente'));

    const inizio = new Date(data.inizio);
    const fine = new Date(inizio.getTime() + servizio.durataMini * 60 * 1000);

    // Check for overlap
    const overlap = await prisma.appuntamento.findFirst({
      where: {
        tenantId,
        staffId: data.staffId,
        stato: { notIn: ['cancelled'] },
        AND: [
          { inizio: { lt: fine } },
          { fine: { gt: inizio } },
        ],
      },
    });
    if (overlap) return next(badRequest('Lo slot è già occupato'));

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    const appuntamento = await prisma.appuntamento.create({
      data: {
        tenantId,
        clienteId: data.clienteId,
        staffId: data.staffId,
        servizioId: data.servizioId,
        inizio,
        fine,
        stato: tenant?.accontoRichiesto ? 'pending' : 'confirmed',
        importo: servizio.prezzo,
        note: data.note,
      },
      include: { cliente: true, staff: true, servizio: true },
    });

    await scheduleAppointmentNotifications(appuntamento.id, tenantId, cliente, inizio);

    res.status(201).json(appuntamento);
  } catch (err) {
    next(err);
  }
}

export async function getAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const app = await prisma.appuntamento.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: { cliente: true, staff: true, servizio: true, pagamenti: true, notifiche: true },
    });
    if (!app) return next(notFound('Appuntamento'));
    res.json(app);
  } catch (err) {
    next(err);
  }
}

export async function updateAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    const tenantId = req.tenantId!;

    const existing = await prisma.appuntamento.findFirst({
      where: { id: req.params.id, tenantId },
      include: { cliente: true, servizio: true },
    });
    if (!existing) return next(notFound('Appuntamento'));

    const updateData: Record<string, unknown> = {};
    if (data.stato) updateData.stato = data.stato;
    if (data.note !== undefined) updateData.note = data.note;

    if (data.inizio) {
      const inizio = new Date(data.inizio);
      const fine = new Date(inizio.getTime() + existing.servizio.durataMini * 60 * 1000);

      const overlap = await prisma.appuntamento.findFirst({
        where: {
          tenantId,
          staffId: existing.staffId,
          stato: { notIn: ['cancelled'] },
          id: { not: existing.id },
          AND: [{ inizio: { lt: fine } }, { fine: { gt: inizio } }],
        },
      });
      if (overlap) return next(badRequest('Lo slot è già occupato'));

      updateData.inizio = inizio;
      updateData.fine = fine;
    }

    const updated = await prisma.appuntamento.update({
      where: { id: req.params.id },
      data: updateData,
      include: { cliente: true, staff: true, servizio: true },
    });

    // Update client stats if done
    if (data.stato === 'done') {
      await prisma.cliente.update({
        where: { id: existing.clienteId },
        data: {
          visiteTotali: { increment: 1 },
          valoreTotale: { increment: existing.importo },
          ultimaVisita: new Date(),
        },
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.appuntamento.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: { cliente: true },
    });
    if (!existing) return next(notFound('Appuntamento'));

    await prisma.appuntamento.update({
      where: { id: req.params.id },
      data: { stato: 'cancelled' },
    });

    await sendCancellationNotification(existing.id, req.tenantId!, existing.cliente);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
