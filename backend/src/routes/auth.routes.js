import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', resetPassword);
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;
