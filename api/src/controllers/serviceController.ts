import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { notFound } from '../utils/errors';

const createSchema = z.object({
  nome: z.string().min(2),
  durataMini: z.number().int().positive(),
  prezzo: z.number().positive(),
});

const updateSchema = createSchema.partial().extend({
  attivo: z.boolean().optional(),
});

export async function listServices(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.servizio.findMany({
      where: { tenantId: req.tenantId!, attivo: true },
      orderBy: { nome: 'asc' },
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createService(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const servizio = await prisma.servizio.create({
      data: { ...data, tenantId: req.tenantId! },
    });
    res.status(201).json(servizio);
  } catch (err) {
    next(err);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.servizio.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });
    if (!existing) return next(notFound('Servizio'));

    const data = updateSchema.parse(req.body);
    const updated = await prisma.servizio.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
