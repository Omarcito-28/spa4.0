import { Router } from 'express';
import { reviewController as reviews, authMiddleware as auth } from '../container.js';

const router = Router();

router.get('/', reviews.handle('list'));
router.get('/summary', reviews.handle('summary'));
router.get('/mine', auth.authenticate, auth.requireRole(['CLIENT']), reviews.handle('mine'));
router.get('/all', auth.authenticate, auth.requireRole(['ADMIN']), reviews.handle('listAll'));
router.post('/', auth.authenticate, auth.requireRole(['CLIENT']), reviews.handle('create'));
router.delete('/:id', auth.authenticate, auth.requireRole(['ADMIN']), reviews.handle('remove'));

export default router;
