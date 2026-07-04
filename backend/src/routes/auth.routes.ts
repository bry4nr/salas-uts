import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
// Ruta protegida para que el frontend pueda auto-loguearse si ya tiene un token guardado
router.get('/me', verifyToken, getMe);

export default router;