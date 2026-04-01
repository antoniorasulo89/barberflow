import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import { listServices, createService, updateService } from '../controllers/serviceController';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', listServices);
router.post('/', createService);
router.patch('/:id', updateService);

export default router;
