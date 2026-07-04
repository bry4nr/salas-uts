import { Router } from 'express';
import { createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipment.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren estar autenticado y tener rol SOPORTE o ADMIN
router.use(verifyToken);
router.use(requireRole(['SOPORTE', 'ADMIN']));

router.post('/salones/:roomId/equipments', createEquipment);
router.patch('/equipments/:id', updateEquipment);
router.delete('/equipments/:id', deleteEquipment);

export default router;