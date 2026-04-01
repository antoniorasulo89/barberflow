import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSms } from '../services/smsService';

const testSchema = z.object({
  telefono: z.string(),
  messaggio: z.string().min(1),
});

export async function testNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { telefono, messaggio } = testSchema.parse(req.body);
    await sendSms(telefono, messaggio);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
