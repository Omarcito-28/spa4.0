import { Router } from 'express';
import {
  getAllServices,
  createService,
  updateService,
  deleteService
} from '../controllers/services.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getAllServices);
router.post('/', authenticateToken, requireRole(['ADMIN']), createService);
router.put('/:id', authenticateToken, requireRole(['ADMIN']), updateService);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), deleteService);

export default router;
