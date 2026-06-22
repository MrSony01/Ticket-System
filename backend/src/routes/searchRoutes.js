import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { globalSearch } from '../controllers/searchController.js';

const router = Router();
router.use(authenticate);
router.get('/', globalSearch);

export default router;
