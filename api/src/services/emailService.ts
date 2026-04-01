import { Resend } from 'resend';
import { logger } from '../utils/logger';

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = getResend();
  if (!client) {
    logger.warn('Resend not configured — email skipped', { to, subject });
    return;
  }

  try {
    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@barberflow.io',
      to,
      subject,
      html,
    });
    logger.info('Email sent', { to, subject });
  } catch (err) {
    logger.error('Email send failed', { to, err });
    throw err;
  }
}
