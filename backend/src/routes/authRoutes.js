import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword, getInvite, acceptInvite } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login',    loginLimiter, login);

router.get('/me',              authenticate, getMe);
router.patch('/me',            authenticate, updateMe);
router.patch('/me/password',   authenticate, changePassword);

router.get('/invite/:token',  getInvite);
router.post('/invite/:token', acceptInvite);

export default router;
