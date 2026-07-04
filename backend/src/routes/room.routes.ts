import { Router } from 'express';
import { getRoomByName } from '../controllers/room.controller';

const router = Router();

// GET /api/salones/:name -> Trae la información de la sala y sus equipos
router.get('/:name', getRoomByName);

export default router;