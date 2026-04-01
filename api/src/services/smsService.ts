import twilio from 'twilio';
import { logger } from '../utils/logger';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const twilioClient = getClient();
  if (!twilioClient) {
    logger.warn('Twilio not configured — SMS skipped', { to, body });
    return;
  }

  try {
    await twilioClient.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body,
    });
    logger.info('SMS sent', { to });
  } catch (err) {
    logger.error('SMS send failed', { to, err });
    throw err;
  }
}
