import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize }    from '../middlewares/roleMiddleware.js';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  commentTicket,
} from '../controllers/ticketController.js';

const router = Router();

router.use(authenticate);

router.get('/',    getTickets);
router.get('/:id', getTicket);

router.post('/', authorize('user', 'technician', 'admin'), createTicket);

router.patch('/:id',         authorize('technician', 'admin'), updateTicket);
router.post('/:id/comments', authorize('user', 'technician', 'admin'), commentTicket);

export default router;
