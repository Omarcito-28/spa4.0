import { Router } from 'express';
import { authController as authControl, authMiddleware as auth, loginRateLimiter } from '../container.js';

const router = Router();

router.post('/register', authControl.handle('register'));
router.post('/login', loginRateLimiter.handle, authControl.handle('login'));
router.post('/password-reset/request', authControl.handle('requestPasswordReset'));
router.post('/password-reset/confirm', authControl.handle('resetPassword'));
router.get('/me', auth.authenticate, authControl.handle('getProfile'));
router.put('/profile', auth.authenticate, authControl.handle('updateProfile'));

export default router;
