import { Router } from 'express';
import { timeOffController as timeOff, authMiddleware as auth } from '../container.js';

const router = Router();
const staff = auth.requireRole(['STYLIST', 'ADMIN']);

router.get('/', auth.authenticate, staff, timeOff.handle('list'));
router.post('/', auth.authenticate, staff, timeOff.handle('create'));
router.delete('/:id', auth.authenticate, staff, timeOff.handle('remove'));

export default router;
