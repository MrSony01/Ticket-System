import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize }    from '../middlewares/roleMiddleware.js';
import { getUsers, createUser, updateRole, deleteUser, getGroups, createGroup } from '../controllers/adminController.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users',            getUsers);
router.post('/users',           createUser);
router.patch('/users/:id/role', updateRole);
router.delete('/users/:id',     deleteUser);

router.get('/groups',  getGroups);
router.post('/groups', createGroup);

export default router;
