import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../controllers/notificationController.js';

const router = Router();

router.use(authenticate);

router.get('/',           getNotifications);
router.get('/unread',     getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

export default router;
