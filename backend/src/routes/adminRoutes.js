import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize }    from '../middlewares/roleMiddleware.js';
import { getUsers, createUser, createInvite, updateRole, updateUserGroup, deleteUser, getGroups, createGroup, deleteGroup, getStats, getCompanySettings, updateCompanySettings } from '../controllers/adminController.js';
import { getReports } from '../controllers/reportController.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users',             getUsers);
router.post('/users',            createUser);
router.post('/users/invite',     createInvite);
router.patch('/users/:id/role',  updateRole);
router.patch('/users/:id/group', updateUserGroup);
router.delete('/users/:id',     deleteUser);

router.get('/groups',        getGroups);
router.post('/groups',       createGroup);
router.delete('/groups/:id', deleteGroup);

router.get('/stats',   getStats);
router.get('/reports', getReports);

router.get('/company',   getCompanySettings);
router.patch('/company', updateCompanySettings);

export default router;
