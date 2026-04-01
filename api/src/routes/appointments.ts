import { Router } from 'express';
import { authenticate, tenantGuard } from '../middleware/auth';
import {
  listAppointments,
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', listAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
