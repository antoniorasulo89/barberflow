import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth';
import appointmentRoutes from './routes/appointments';
import availabilityRoutes from './routes/availability';
import clientRoutes from './routes/clients';
import staffRoutes from './routes/staff';
import serviceRoutes from './routes/services';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
import publicRoutes from './routes/public';
import { startJobs } from './jobs';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(requestLogger);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/availability', availabilityRoutes);
app.use('/clients', clientRoutes);
app.use('/staff', staffRoutes);
app.use('/services', serviceRoutes);
app.use('/payments', paymentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/public', publicRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`BarberFlow API running on port ${PORT}`);
  startJobs();
});

export default app;
