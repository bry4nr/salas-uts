import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { roomId, equipmentId, creatorId, category, title, description, priority, correoInstitucional, valoracionApp, otherBuilding, otherRoom } = req.body;

    // Validación básica de campos obligatorios
    if (!creatorId || !category || !title || !description) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!roomId && (!otherBuilding || !otherRoom)) {
      return res.status(400).json({ error: 'Debe especificar una sala o indicar el edificio y salón' });
    }

    // Fallback amigable: Si el frontend envía el ID mockeado, buscamos el primer docente en la DB
    let finalCreatorId = creatorId;
    if (creatorId === "REEMPLAZAR_CON_UUID_DE_SUPABASE") {
      const fallbackUser = await prisma.user.findFirst({ where: { role: 'DOCENTE' } });
      if (fallbackUser) finalCreatorId = fallbackUser.id;
    }

    // REGLA CRÍTICA: Evitar duplicados si se está reportando un equipo específico
    if (equipmentId) {
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          equipmentId: equipmentId,
          status: {
            in: ['PENDING', 'IN_PROGRESS'] // Solo tickets activos
          }
        }
      });

      if (existingTicket) {
        return res.status(400).json({ 
          error: 'Este equipo ya tiene un reporte en curso.',
          ticket: existingTicket 
        });
      }
    }

    // Ejecutamos una Transacción para asegurar la integridad de datos
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el ticket
      const newTicket = await tx.ticket.create({
        data: {
          roomId: roomId || null,
          equipmentId: equipmentId || null, // Soporta reportes generales de sala
          creatorId: finalCreatorId,
          correoInstitucional: correoInstitucional || null,
          valoracionApp: valoracionApp || null,
          otherBuilding: otherBuilding || null,
          otherRoom: otherRoom || null,
          category,
          title,
          description,
          priority: priority || 'MEDIUM',
        }
      });

      // 2. Si hay un equipo específico, actualizar su estado a REPORTED
      if (equipmentId) {
        await tx.equipment.update({
          where: { id: equipmentId },
          data: { status: 'REPORTED' }
        });
      }

      return newTicket;
    });

    return res.status(201).json({ message: 'Ticket creado exitosamente', ticket: result });

  } catch (error) {
    console.error('Error en createTicket:', error);
    return res.status(500).json({ error: 'Error interno del servidor al crear el ticket' });
  }
};

export const getTicketsByRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const tickets = await prisma.ticket.findMany({
      where: {
        roomId: roomId as string,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        equipment: { select: { tag: true } }, // Traemos el tag (Ej: A1-2) para el mapa visual
      }
    });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error en getTicketsByRoom:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAllTickets = async (_req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        room: { select: { name: true } },
        equipment: { select: { tag: true } },
        creator: { select: { name: true } }
      }
    });
    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Error en getAllTickets:', error);
    return res.status(500).json({ error: 'Error interno del servidor al obtener tickets' });
  }
};

export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    // Simulamos la autenticación buscando al primer usuario del rol especificado
    const user = await prisma.user.findFirst({ where: { role: role === 'soporte' ? 'SOPORTE' : 'DOCENTE' } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const tickets = await prisma.ticket.findMany({
      where: { creatorId: user.id },
      orderBy: { created_at: 'desc' },
      include: {
        room: { select: { name: true } },
        equipment: { select: { tag: true } }
      }
    });
    return res.status(200).json(tickets);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener mis tickets' });
  }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // PENDING, IN_PROGRESS, o RESOLVED

    const result = await prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id: id as string },
        data: {
          status,
          resolved_at: status === 'RESOLVED' ? new Date() : null, // Se marca la fecha si se resolvió
        },
        include: { equipment: true } // Traemos el equipo para saber si debemos actualizarlo
      });

      // Si se resuelve, devolver el equipo a estado 'OK' y BORRAR EL CHAT para ahorrar espacio
      if (status === 'RESOLVED') {
        if (updatedTicket.equipmentId) {
          await tx.equipment.update({
            where: { id: updatedTicket.equipmentId },
            data: { status: 'OK' }
          });
        }
        await tx.message.deleteMany({ where: { ticketId: id as string } });
      }
      // Si por alguna razón pasa de RESOLVED a IN_PROGRESS, lo devolvemos a REPORTED
      else if (status !== 'RESOLVED' && updatedTicket.equipmentId) {
        await tx.equipment.update({
          where: { id: updatedTicket.equipmentId },
          data: { status: 'REPORTED' }
        });
      }

      return updatedTicket;
    });

    return res.status(200).json({ message: 'Estado actualizado correctamente', ticket: result });
  } catch (error) {
    console.error('Error en updateTicketStatus:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTicketMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: { ticketId: id as string },
      include: { sender: { select: { name: true, role: true } } },
      orderBy: { created_at: 'asc' }
    });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

export const addTicketMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, role } = req.body;
    
    const user = await prisma.user.findFirst({ where: { role: role === 'soporte' ? 'SOPORTE' : 'DOCENTE' } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const newMessage = await prisma.message.create({
      data: { ticketId: id as string, senderId: user.id, text },
      include: { sender: { select: { name: true, role: true } } }
    });
    return res.status(201).json(newMessage);
  } catch (error) {
    return res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};