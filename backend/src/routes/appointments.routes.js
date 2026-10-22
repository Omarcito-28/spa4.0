import { Router } from 'express';
import {
  getAppointments,
  getStylistAvailability,
  createAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment
} from '../controllers/appointments.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, getAppointments);
router.get('/availability', getStylistAvailability);
router.post('/', authenticateToken, createAppointment);
router.put('/:id/reschedule', authenticateToken, rescheduleAppointment);
router.put('/:id', authenticateToken, requireRole(['ADMIN']), updateAppointment);
router.put('/:id/status', authenticateToken, updateAppointmentStatus);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteAppointment);

export default router;
