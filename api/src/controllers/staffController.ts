import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { notFound } from '../utils/errors';

const createSchema = z.object({
  nome: z.string().min(2),
  ruolo: z.string().default('barbiere'),
  telefono: z.string().optional(),
});

const servicesSchema = z.object({
  servizioIds: z.array(z.string()).default([]),
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
    const [items, allServices, assignmentsCount] = await Promise.all([
      prisma.staff.findMany({
        where: { tenantId: req.tenantId!, attivo: true },
        include: {
          servizi: {
            include: {
              servizio: true,
            },
          },
        },
        orderBy: { nome: 'asc' },
      }),
      prisma.servizio.findMany({
        where: { tenantId: req.tenantId!, attivo: true },
        orderBy: { nome: 'asc' },
      }),
      prisma.staffServizio.count({
        where: { staff: { tenantId: req.tenantId! } },
      }),
    ]);
    const usesAssignments = assignmentsCount > 0;
    res.json(items.map((item) => ({
      ...item,
      servizi: usesAssignments ? item.servizi.map((entry) => entry.servizio) : allServices,
    })));
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
    const servizi = await prisma.servizio.findMany({
      where: { tenantId: req.tenantId!, attivo: true },
      select: { id: true },
    });
    if (servizi.length > 0) {
      await prisma.staffServizio.createMany({
        data: servizi.map((servizio) => ({ staffId: staff.id, servizioId: servizio.id })),
        skipDuplicates: true,
      });
    }
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

export async function getStaffServices(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });
    if (!staff) return next(notFound('Staff'));

    const [services, assignmentsCount, allServices] = await Promise.all([
      prisma.staffServizio.findMany({
        where: { staffId: req.params.id },
        include: { servizio: true },
        orderBy: { servizio: { nome: 'asc' } },
      }),
      prisma.staffServizio.count({
        where: { staff: { tenantId: req.tenantId! } },
      }),
      prisma.servizio.findMany({
        where: { tenantId: req.tenantId!, attivo: true },
        orderBy: { nome: 'asc' },
      }),
    ]);

    res.json(assignmentsCount > 0 ? services.map((entry) => entry.servizio) : allServices);
  } catch (err) {
    next(err);
  }
}

export async function updateStaffServices(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = await prisma.staff.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });
    if (!staff) return next(notFound('Staff'));

    const { servizioIds } = servicesSchema.parse(req.body);
    const servizi = await prisma.servizio.findMany({
      where: {
        tenantId: req.tenantId!,
        id: { in: servizioIds },
      },
      select: { id: true },
    });

    await prisma.staffServizio.deleteMany({ where: { staffId: req.params.id } });
    if (servizi.length > 0) {
      await prisma.staffServizio.createMany({
        data: servizi.map((servizio) => ({ staffId: req.params.id, servizioId: servizio.id })),
      });
    }

    const updated = await prisma.staffServizio.findMany({
      where: { staffId: req.params.id },
      include: { servizio: true },
      orderBy: { servizio: { nome: 'asc' } },
    });

    res.json(updated.map((entry) => entry.servizio));
  } catch (err) {
    next(err);
  }
}
