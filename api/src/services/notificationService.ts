import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { sendSms } from './smsService';
import { sendEmail } from './emailService';
import { Cliente } from '@prisma/client';

export async function scheduleAppointmentNotifications(
  appuntamentoId: string,
  tenantId: string,
  cliente: Cliente,
  inizio: Date
): Promise<void> {
  const notifications: {
    canale: 'sms' | 'email' | 'push';
    tipo: 'conferma' | 'reminder_24h' | 'reminder_1h' | 'cancellazione';
    schedulataAt: Date;
  }[] = [];

  // Immediate confirmation
  if (cliente.telefono) {
    notifications.push({
      canale: 'sms',
      tipo: 'conferma',
      schedulataAt: new Date(),
    });
  }
  if (cliente.email) {
    notifications.push({
      canale: 'email',
      tipo: 'conferma',
      schedulataAt: new Date(),
    });
  }

  // 24h reminder
  const reminder24h = new Date(inizio.getTime() - 24 * 60 * 60 * 1000);
  if (reminder24h > new Date()) {
    if (cliente.telefono) {
      notifications.push({ canale: 'sms', tipo: 'reminder_24h', schedulataAt: reminder24h });
    }
    if (cliente.email) {
      notifications.push({ canale: 'email', tipo: 'reminder_24h', schedulataAt: reminder24h });
    }
  }

  // 1h reminder
  const reminder1h = new Date(inizio.getTime() - 60 * 60 * 1000);
  if (reminder1h > new Date()) {
    if (cliente.telefono) {
      notifications.push({ canale: 'sms', tipo: 'reminder_1h', schedulataAt: reminder1h });
    }
  }

  await prisma.notifica.createMany({
    data: notifications.map((n) => ({
      appuntamentoId,
      clienteId: cliente.id,
      ...n,
    })),
  });
}

export async function sendCancellationNotification(
  appuntamentoId: string,
  tenantId: string,
  cliente: Cliente
): Promise<void> {
  await prisma.notifica.create({
    data: {
      appuntamentoId,
      clienteId: cliente.id,
      canale: cliente.telefono ? 'sms' : 'email',
      tipo: 'cancellazione',
      schedulataAt: new Date(),
    },
  });
}

export async function processNotification(notificaId: string): Promise<void> {
  const notifica = await prisma.notifica.findUnique({
    where: { id: notificaId },
    include: {
      appuntamento: {
        include: { staff: true, servizio: true, tenant: true },
      },
      cliente: true,
    },
  });

  if (!notifica || notifica.stato !== 'pending') return;

  const { cliente, appuntamento } = notifica;
  const inizio = new Date(appuntamento.inizio);
  const dataStr = inizio.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const oraStr = inizio.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const messages: Record<string, { sms: string; emailSubject: string; emailHtml: string }> = {
    conferma: {
      sms: `Ciao ${cliente.nome}! Il tuo appuntamento con ${appuntamento.staff.nome} per ${appuntamento.servizio.nome} il ${dataStr} alle ${oraStr} è confermato. - ${appuntamento.tenant.nome}`,
      emailSubject: `Prenotazione confermata - ${appuntamento.tenant.nome}`,
      emailHtml: `<h2>Prenotazione confermata!</h2><p>Ciao ${cliente.nome},</p><p>Il tuo appuntamento è confermato:</p><ul><li><strong>Servizio:</strong> ${appuntamento.servizio.nome}</li><li><strong>Barbiere:</strong> ${appuntamento.staff.nome}</li><li><strong>Data:</strong> ${dataStr} alle ${oraStr}</li><li><strong>Importo:</strong> €${appuntamento.importo}</li></ul>`,
    },
    reminder_24h: {
      sms: `Promemoria: domani alle ${oraStr} hai un appuntamento con ${appuntamento.staff.nome} per ${appuntamento.servizio.nome}. - ${appuntamento.tenant.nome}`,
      emailSubject: `Promemoria appuntamento domani - ${appuntamento.tenant.nome}`,
      emailHtml: `<h2>Promemoria appuntamento</h2><p>Ciao ${cliente.nome},</p><p>Ti ricordiamo il tuo appuntamento di domani:</p><ul><li><strong>Servizio:</strong> ${appuntamento.servizio.nome}</li><li><strong>Barbiere:</strong> ${appuntamento.staff.nome}</li><li><strong>Ora:</strong> ${oraStr}</li></ul>`,
    },
    reminder_1h: {
      sms: `Promemoria: tra 1 ora hai un appuntamento con ${appuntamento.staff.nome}. - ${appuntamento.tenant.nome}`,
      emailSubject: `Appuntamento tra 1 ora - ${appuntamento.tenant.nome}`,
      emailHtml: `<h2>Appuntamento tra 1 ora</h2><p>Ciao ${cliente.nome}, ti aspettiamo tra poco!</p>`,
    },
    cancellazione: {
      sms: `Il tuo appuntamento del ${dataStr} alle ${oraStr} è stato cancellato. - ${appuntamento.tenant.nome}`,
      emailSubject: `Appuntamento cancellato - ${appuntamento.tenant.nome}`,
      emailHtml: `<h2>Appuntamento cancellato</h2><p>Ciao ${cliente.nome},</p><p>Il tuo appuntamento del ${dataStr} alle ${oraStr} è stato cancellato.</p>`,
    },
  };

  const msg = messages[notifica.tipo];
  if (!msg) return;

  try {
    if (notifica.canale === 'sms' && cliente.telefono) {
      await sendSms(cliente.telefono, msg.sms);
    } else if (notifica.canale === 'email' && cliente.email) {
      await sendEmail(cliente.email, msg.emailSubject, msg.emailHtml);
    }

    await prisma.notifica.update({
      where: { id: notificaId },
      data: { stato: 'sent', inviatAt: new Date() },
    });
  } catch (err) {
    logger.error('Failed to send notification', { notificaId, err });
    await prisma.notifica.update({
      where: { id: notificaId },
      data: { stato: 'failed' },
    });
  }
}
