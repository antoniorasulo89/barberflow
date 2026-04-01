import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import {
  listClients,
  createClient,
  getClient,
  updateClient,
  getClientStats,
} from '../controllers/clientController';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', listClients);
router.post('/', createClient);
router.get('/:id/stats', getClientStats);
router.get('/:id', getClient);
router.patch('/:id', updateClient);

export default router;
