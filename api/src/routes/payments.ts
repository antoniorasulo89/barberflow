import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import { createPaymentIntent, stripeWebhook } from '../controllers/paymentController';

const router = Router();

router.post('/webhook', stripeWebhook);
router.use(authenticate, tenantGuard);
router.post('/create-intent', createPaymentIntent);

export default router;
