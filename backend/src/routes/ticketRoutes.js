import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize }    from '../middlewares/roleMiddleware.js';
import {
  getTickets,
  getTicket,
  getTicketActivity,
  createTicket,
  updateTicket,
  commentTicket,
  exportTickets,
} from '../controllers/ticketController.js';

const router = Router();

router.use(authenticate);

router.get('/',            getTickets);
router.get('/export',      authorize('admin'), exportTickets);
router.get('/:id',         getTicket);
router.get('/:id/activity', getTicketActivity);

router.post('/', authorize('user', 'technician', 'admin'), createTicket);

router.patch('/:id',         authorize('technician', 'admin'), updateTicket);
router.post('/:id/comments', authorize('user', 'technician', 'admin'), commentTicket);

export default router;
