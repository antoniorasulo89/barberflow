import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { notFound, badRequest } from '../utils/errors';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-04-10',
});

const intentSchema = z.object({
  appuntamentoId: z.string(),
});

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const { appuntamentoId } = intentSchema.parse(req.body);
    const tenantId = req.tenantId!;

    const app = await prisma.appuntamento.findFirst({
      where: { id: appuntamentoId, tenantId },
      include: { cliente: true, servizio: true, tenant: true },
    });
    if (!app) return next(notFound('Appuntamento'));

    if (!app.tenant.accontoRichiesto) {
      return next(badRequest('Questo tenant non richiede acconto'));
    }

    const accontoAmount = Math.round((app.importo * app.tenant.accontoPerc) / 100 * 100); // cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount: accontoAmount,
      currency: 'eur',
      metadata: {
        appuntamentoId: app.id,
        tenantId,
        clienteId: app.clienteId,
      },
    });

    await prisma.pagamento.create({
      data: {
        appuntamentoId: app.id,
        stripePaymentId: paymentIntent.id,
        importo: accontoAmount / 100,
        tipo: 'acconto',
        stato: 'pending',
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error('Stripe webhook signature failed', { err });
    res.status(400).json({ error: 'Webhook signature invalid' });
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const appuntamentoId = pi.metadata.appuntamentoId;

    if (appuntamentoId) {
      await prisma.pagamento.updateMany({
        where: { stripePaymentId: pi.id },
        data: { stato: 'paid', pagatoAt: new Date() },
      });

      await prisma.appuntamento.update({
        where: { id: appuntamentoId },
        data: { stato: 'confirmed' },
      });

      logger.info('Payment confirmed', { appuntamentoId, paymentIntentId: pi.id });
    }
  }

  res.json({ received: true });
}
