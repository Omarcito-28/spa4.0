import { Router } from 'express';
import { clientNoteController as notes, authMiddleware as auth } from '../container.js';

const router = Router();
const staff = auth.requireRole(['STYLIST', 'ADMIN']);

router.get('/:client', auth.authenticate, staff, notes.handle('list'));
router.post('/:client', auth.authenticate, staff, notes.handle('create'));
router.delete('/note/:id', auth.authenticate, staff, notes.handle('remove'));

export default router;
