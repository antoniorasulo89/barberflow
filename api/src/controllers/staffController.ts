import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { notFound } from '../utils/errors';

const createSchema = z.object({
  nome: z.string().min(2),
  ruolo: z.string().default('barbiere'),
  telefono: z.string().optional(),
});

const scheduleSchema = z.array(
  z.object({
    giornoSettimana: z.number().min(0).max(6),
    oraInizio: z.string().regex(/^\d{2}:\d{2}$/),
    oraFine: z.string().regex(/^\d{2}:\d{2}$/),
    attivo: z.boolean().default(true),
  })
);

export async function listStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.staff.findMany({
      where: { tenantId: req.tenantId!, attivo: true },
      orderBy: { nome: 'asc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const staff = await prisma.staff.create({
      data: { ...data, tenantId: req.tenantId! },
    });
    res.status(201).json(staff);
  } catch (err) {
    next(err);
  }
}

export async function getStaffSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });
    if (!staff) return next(notFound('Staff'));

    const schedule = await prisma.disponibilita.findMany({
      where: { staffId: req.params.id },
      orderBy: { giornoSettimana: 'asc' },
    });
    res.json(schedule);
  } catch (err) {
    next(err);
  }
}

export async function updateStaffSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });
    if (!staff) return next(notFound('Staff'));

    const slots = scheduleSchema.parse(req.body);

    // Replace all schedule entries for this staff
    await prisma.disponibilita.deleteMany({ where: { staffId: req.params.id } });
    await prisma.disponibilita.createMany({
      data: slots.map((s) => ({ ...s, staffId: req.params.id })),
    });

    const schedule = await prisma.disponibilita.findMany({
      where: { staffId: req.params.id },
      orderBy: { giornoSettimana: 'asc' },
    });
    res.json(schedule);
  } catch (err) {
    next(err);
  }
}
