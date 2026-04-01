import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import { testNotification } from '../controllers/notificationController';

const router = Router();
router.use(authenticate, tenantGuard);
router.post('/test', testNotification);

export default router;
