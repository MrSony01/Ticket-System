import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize }    from '../middlewares/roleMiddleware.js';
import { getCategories, createCategory, deleteCategory } from '../controllers/categoryController.js';

const router = Router();

router.get('/',      authenticate, getCategories);
router.post('/',     authenticate, authorize('admin'), createCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;
