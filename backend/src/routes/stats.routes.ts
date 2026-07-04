import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/stats/dashboard -> Trae las estadísticas agrupadas
router.get('/dashboard', verifyToken, getDashboardStats);

export default router;