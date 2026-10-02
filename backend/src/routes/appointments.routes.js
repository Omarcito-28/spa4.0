import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment
} from '../controllers/appointments.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, getAppointments);
router.post('/', authenticateToken, createAppointment);
router.put('/:id/status', authenticateToken, updateAppointmentStatus);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteAppointment);

export default router;
