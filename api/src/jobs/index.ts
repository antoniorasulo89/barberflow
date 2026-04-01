import cron from 'node-cron';
import { logger } from '../utils/logger';
import { processNotificationsJob } from './processNotifications';
import { scheduleReminders24hJob } from './scheduleReminders';
import { markNoshowJob } from './markNoshow';

export function startJobs(): void {
  // Job 1: Every 5 minutes — process pending notifications
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Job: processing pending notifications');
    try {
      await processNotificationsJob();
    } catch (err) {
      logger.error('Job processNotifications failed', { err });
    }
  });

  // Job 2: Every day at 08:00 — schedule 24h reminders
  cron.schedule('0 8 * * *', async () => {
    logger.info('Job: scheduling 24h reminders');
    try {
      await scheduleReminders24hJob();
    } catch (err) {
      logger.error('Job scheduleReminders24h failed', { err });
    }
  });

  // Job 3: Every day at 23:00 — mark no-shows
  cron.schedule('0 23 * * *', async () => {
    logger.info('Job: marking no-shows');
    try {
      await markNoshowJob();
    } catch (err) {
      logger.error('Job markNoshow failed', { err });
    }
  });

  logger.info('Cron jobs started');
}
