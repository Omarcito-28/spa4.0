import { Router } from 'express';
import { getAllUsers, getStylists, getSchedule, updateSchedule, updateUser, deleteUser } from '../controllers/users.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/stylists', getStylists);
router.get('/me/schedule', authenticateToken, requireRole(['STYLIST']), getSchedule);
router.put('/me/schedule', authenticateToken, requireRole(['STYLIST']), updateSchedule);
router.get('/', authenticateToken, requireRole(['ADMIN']), getAllUsers);
router.put('/:id', authenticateToken, requireRole(['ADMIN']), updateUser);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteUser);

export default router;
