import { Router } from 'express';
import { serviceController as services, authMiddleware as auth } from '../container.js';

const router = Router();

router.get('/', services.handle('list'));
router.post('/', auth.authenticate, auth.requireRole(['ADMIN']), services.handle('create'));
router.put('/:id', auth.authenticate, auth.requireRole(['ADMIN']), services.handle('update'));
router.delete('/:id', auth.authenticate, auth.requireRole(['ADMIN']), services.handle('remove'));

export default router;
