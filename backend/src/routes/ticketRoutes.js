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

router.post('/', authorize('user', 'agent', 'manager', 'admin'), createTicket);

router.patch('/:id',          authorize('agent', 'manager', 'admin'), updateTicket);
router.post('/:id/comments',  authorize('user', 'agent', 'manager', 'admin'), commentTicket);

export default router;
