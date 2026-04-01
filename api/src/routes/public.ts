import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { notFound } from '../utils/errors';
import { getAvailableSlots } from '../services/availabilityService';

const router = Router();

// Resolve tenant by slug — helper
async function getTenant(slug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) throw notFound('Barbershop');
  return tenant;
}

// GET /public/:slug/services
router.get('/:slug/services', async (req, res, next) => {
  try {
    const tenant = await getTenant(req.params.slug);
    const servizi = await prisma.servizio.findMany({
      where: { tenantId: tenant.id, attivo: true },
      orderBy: { nome: 'asc' },
    });
    res.json(servizi);
  } catch (err) { next(err); }
});

// GET /public/:slug/staff
router.get('/:slug/staff', async (req, res, next) => {
  try {
    const tenant = await getTenant(req.params.slug);
    const staff = await prisma.staff.findMany({
      where: { tenantId: tenant.id, attivo: true },
      orderBy: { nome: 'asc' },
    });
    res.json(staff);
  } catch (err) { next(err); }
});

// GET /public/:slug/availability?staffId=&date=&serviceId=
router.get('/:slug/availability', async (req, res, next) => {
  try {
    const tenant = await getTenant(req.params.slug);
    const { staffId, date, serviceId } = z.object({
      staffId: z.string(),
      date: z.string(),
      serviceId: z.string(),
    }).parse(req.query);

    const servizio = await prisma.servizio.findFirst({
      where: { id: serviceId, tenantId: tenant.id, attivo: true },
    });
    if (!servizio) return next(notFound('Servizio'));

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId: tenant.id, attivo: true },
    });
    if (!staff) return next(notFound('Staff'));

    const slots = await getAvailableSlots(tenant.id, staffId, date, servizio.durataMini);
    res.json(slots);
  } catch (err) { next(err); }
});

// POST /public/:slug/book
router.post('/:slug/book', async (req, res, next) => {
  try {
    const tenant = await getTenant(req.params.slug);
    const data = z.object({
      nome: z.string().min(2),
      telefono: z.string().optional(),
      email: z.string().email().optional(),
      staffId: z.string(),
      servizioId: z.string(),
      inizio: z.string().datetime(),
      note: z.string().optional(),
    }).parse(req.body);

    const servizio = await prisma.servizio.findFirst({
      where: { id: data.servizioId, tenantId: tenant.id, attivo: true },
    });
    if (!servizio) return next(notFound('Servizio'));

    const staff = await prisma.staff.findFirst({
      where: { id: data.staffId, tenantId: tenant.id, attivo: true },
    });
    if (!staff) return next(notFound('Staff'));

    // Find or create client by phone/email
    let cliente = await prisma.cliente.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          data.telefono ? { telefono: data.telefono } : {},
          data.email ? { email: data.email } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          tenantId: tenant.id,
          nome: data.nome,
          telefono: data.telefono,
          email: data.email,
        },
      });
    }

    const inizio = new Date(data.inizio);
    const fine = new Date(inizio.getTime() + servizio.durataMini * 60 * 1000);

    // Check overlap
    const overlap = await prisma.appuntamento.findFirst({
      where: {
        tenantId: tenant.id,
        staffId: data.staffId,
        stato: { notIn: ['cancelled'] },
        AND: [{ inizio: { lt: fine } }, { fine: { gt: inizio } }],
      },
    });
    if (overlap) {
      res.status(409).json({ error: 'Slot non più disponibile', code: 'SLOT_TAKEN' });
      return;
    }

    const appuntamento = await prisma.appuntamento.create({
      data: {
        tenantId: tenant.id,
        clienteId: cliente.id,
        staffId: data.staffId,
        servizioId: data.servizioId,
        inizio,
        fine,
        stato: tenant.accontoRichiesto ? 'pending' : 'confirmed',
        importo: servizio.prezzo,
        note: data.note,
      },
      include: { cliente: true, staff: true, servizio: true },
    });

    res.status(201).json(appuntamento);
  } catch (err) { next(err); }
});

export default router;
