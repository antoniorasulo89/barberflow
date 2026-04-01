import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import { getAvailability } from '../controllers/availabilityController';

const router = Router();
router.use(authenticate, tenantGuard);
router.get('/', getAvailability);

export default router;
