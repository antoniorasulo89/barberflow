import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import {
  listStaff,
  createStaff,
  getStaffSchedule,
  updateStaffSchedule,
} from '../controllers/staffController';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', listStaff);
router.post('/', createStaff);
router.get('/:id/schedule', getStaffSchedule);
router.put('/:id/schedule', updateStaffSchedule);

export default router;
