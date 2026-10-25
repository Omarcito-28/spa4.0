import { Router } from 'express';
import { userController as users, authMiddleware as auth } from '../container.js';

const router = Router();

router.get('/stylists', users.handle('listStylists'));
router.get('/me/schedule', auth.authenticate, auth.requireRole(['STYLIST']), users.handle('getSchedule'));
router.put('/me/schedule', auth.authenticate, auth.requireRole(['STYLIST']), users.handle('updateSchedule'));
router.get('/', auth.authenticate, auth.requireRole(['ADMIN']), users.handle('list'));
router.post('/', auth.authenticate, auth.requireRole(['ADMIN']), users.handle('create'));
router.put('/:id', auth.authenticate, auth.requireRole(['ADMIN']), users.handle('update'));
router.delete('/:id', auth.authenticate, auth.requireRole(['ADMIN']), users.handle('remove'));

export default router;
