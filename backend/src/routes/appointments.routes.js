import { Router } from 'express';
import { appointmentController as appointments, authMiddleware as auth } from '../container.js';

const router = Router();

router.get('/', auth.authenticate, appointments.handle('list'));
router.get('/availability', appointments.handle('availability'));
router.post('/', auth.authenticate, appointments.handle('create'));
router.put('/:id/reschedule', auth.authenticate, appointments.handle('reschedule'));
router.put('/:id', auth.authenticate, auth.requireRole(['ADMIN']), appointments.handle('update'));
router.put('/:id/status', auth.authenticate, appointments.handle('updateStatus'));
router.delete('/:id', auth.authenticate, auth.requireRole(['ADMIN']), appointments.handle('remove'));

export default router;
