import { Router } from 'express';
import { createTicket, getTicketsByRoom, updateTicketStatus, getAllTickets, getMyTickets, getTicketMessages, addTicketMessage } from '../controllers/ticket.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();

// Aplicamos el middleware a todas las rutas de tickets a partir de aquí
router.use(verifyToken);

// POST /api/tickets -> Recibe los datos y crea el reporte
router.post('/', createTicket);

// GET /api/tickets -> Trae todos los tickets (para el panel de soporte)
router.get('/', getAllTickets);

// GET /api/tickets/my-tickets -> Trae los tickets del usuario logueado
router.get('/my-tickets', getMyTickets);

// GET /api/tickets/room/:roomId -> Trae tickets activos de una sala (útil para el mapa)
router.get('/room/:roomId', getTicketsByRoom);

// PATCH /api/tickets/:id/status -> Soporte técnico cambia el estado a RESOLVED
router.patch('/:id/status', updateTicketStatus);

// GET y POST para el Chat del Ticket
router.get('/:id/messages', getTicketMessages);
router.post('/:id/messages', addTicketMessage);

export default router;