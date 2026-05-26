import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Ticket routes funcionando ✅' });
});

export default router;