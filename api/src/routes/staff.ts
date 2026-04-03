import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import {
  listStaff,
  createStaff,
  deleteStaff,
  getStaffSchedule,
  getStaffServices,
  updateStaffSchedule,
  updateStaffServices,
} from '../controllers/staffController';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', listStaff);
router.post('/', createStaff);
router.delete('/:id', deleteStaff);
router.get('/:id/schedule', getStaffSchedule);
router.put('/:id/schedule', updateStaffSchedule);
router.get('/:id/services', getStaffServices);
router.put('/:id/services', updateStaffServices);

export default router;
