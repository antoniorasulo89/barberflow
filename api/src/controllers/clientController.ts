import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { notFound } from '../utils/errors';

const createSchema = z.object({
  nome: z.string().min(2),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  tag: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial();

const listSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['visite', 'valore', 'recenti', 'nome']).default('recenti'),
  tag: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, sort, tag, page, limit } = listSchema.parse(req.query);
    const tenantId = req.tenantId!;

    const where: Record<string, unknown> = { tenantId };

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
      ];
    }

    if (tag) {
      where.tag = { has: tag };
    }

    const orderBy: Record<string, string> = {
      visite: 'visiteTotali',
      valore: 'valoreTotale',
      recenti: 'ultimaVisita',
      nome: 'nome',
    };

    const [items, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { [orderBy[sort]]: sort === 'nome' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ]);

    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const cliente = await prisma.cliente.create({
      data: { ...data, tenantId: req.tenantId! },
    });
    res.status(201).json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
      include: {
        appuntamenti: {
          include: { staff: true, servizio: true },
          orderBy: { inizio: 'desc' },
          take: 20,
        },
        clientePreferenze: { include: { staff: true } },
      },
    });
    if (!cliente) return next(notFound('Cliente'));
    res.json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.cliente.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });
    if (!existing) return next(notFound('Cliente'));

    const updated = await prisma.cliente.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function getClientStats(req: Request, res: Response, next: NextFunction) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId! },
    });
    if (!cliente) return next(notFound('Cliente'));

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const appuntamenti = await prisma.appuntamento.findMany({
      where: {
        clienteId: req.params.id,
        tenantId: req.tenantId!,
        inizio: { gte: twelveMonthsAgo },
      },
      select: { inizio: true, stato: true, importo: true },
    });

    // Group by month
    const byMonth: Record<string, { visite: number; valore: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = { visite: 0, valore: 0 };
    }

    let noshowCount = 0;
    for (const app of appuntamenti) {
      const d = new Date(app.inizio);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (byMonth[key] && app.stato === 'done') {
        byMonth[key].visite++;
        byMonth[key].valore += app.importo;
      }
      if (app.stato === 'noshow') noshowCount++;
    }

    const monthlyData = Object.entries(byMonth).map(([mese, dati]) => ({ mese, ...dati }));

    res.json({
      visiteTotali: cliente.visiteTotali,
      valoreTotale: cliente.valoreTotale,
      ultimaVisita: cliente.ultimaVisita,
      noshowCount,
      frequenzaMensile: monthlyData,
    });
  } catch (err) {
    next(err);
  }
}
