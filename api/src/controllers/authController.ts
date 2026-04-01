import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { conflict, unauthorized, badRequest } from '../utils/errors';
import { JwtPayload } from '../middleware/auth';

const registerSchema = z.object({
  nome: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug: solo lettere minuscole, numeri e trattini'),
  email: z.string().email(),
  password: z.string().min(8),
  telefono: z.string().optional(),
  indirizzo: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  slug: z.string(),
});

function signAccess(payload: JwtPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

function signRefresh(payload: { userId: string }) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) return next(conflict('Slug già in uso'));

    const passwordHash = await bcrypt.hash(data.password, 12);

    const tenant = await prisma.tenant.create({
      data: {
        nome: data.nome,
        slug: data.slug,
        telefono: data.telefono,
        indirizzo: data.indirizzo,
        users: {
          create: {
            email: data.email,
            passwordHash,
            nome: data.nome,
            ruolo: 'admin',
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    const jwtPayload: JwtPayload = {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      ruolo: user.ruolo,
    };

    const accessToken = signAccess(jwtPayload);
    const refreshToken = signRefresh({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({ accessToken, refreshToken, tenant: { id: tenant.id, nome: tenant.nome, slug: tenant.slug } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (!tenant) return next(unauthorized());

    const user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: data.email },
    });
    if (!user) return next(unauthorized());

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return next(unauthorized());

    const jwtPayload: JwtPayload = {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      ruolo: user.ruolo,
    };

    const accessToken = signAccess(jwtPayload);
    const refreshToken = signRefresh({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    } catch {
      return next(unauthorized());
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return next(unauthorized());
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });
    if (!user) return next(unauthorized());

    const jwtPayload: JwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      ruolo: user.ruolo,
    };

    const accessToken = signAccess(jwtPayload);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
