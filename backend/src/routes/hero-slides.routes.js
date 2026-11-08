import { Router } from 'express';
import { heroSlideController as slides, authMiddleware as auth } from '../container.js';

const router = Router();
const admin = [auth.authenticate, auth.requireRole(['ADMIN'])];

router.get('/', slides.handle('list'));
router.get('/all', ...admin, slides.handle('listAll'));
router.post('/', ...admin, slides.handle('create'));
// Antes de /:id para que "order" no se tome como un id.
router.put('/order', ...admin, slides.handle('reorder'));
router.put('/:id', ...admin, slides.handle('update'));
router.delete('/:id', ...admin, slides.handle('remove'));

export default router;
