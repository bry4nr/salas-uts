import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const createEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const { tag, type } = req.body;
    const userId = req.user.id as string;

    if (!tag || !type) {
      return res.status(400).json({ error: 'Tag y type son requeridos' });
    }

    // Verificar si la sala existe
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

    // Validar unicidad (ya que unique en prisma es [roomId, tag])
    const existing = await prisma.equipment.findUnique({
      where: {
        roomId_tag: {
          roomId,
          tag: tag as string
        }
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Ya existe un equipo en esta posición (tag duplicado)' });
    }

    // Usar transacción para crear equipo y registro de log
    const equipment = await prisma.$transaction(async (tx) => {
      const eq = await tx.equipment.create({
        data: {
          roomId,
          tag: tag as string,
          type: type === 'VIDEO_BEAM' ? 'VIDEO_BEAM' : 'PC'
        }
      });

      await tx.equipmentLog.create({
        data: {
          action: 'CREATE',
          equipmentId: eq.id,
          userId,
          details: JSON.stringify({ tag: eq.tag, type: eq.type })
        }
      });

      return eq;
    });

    return res.status(201).json(equipment);
  } catch (error) {
    console.error('Error en createEquipment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { tag, type, status } = req.body;
    const userId = req.user.id as string;

    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) return res.status(404).json({ error: 'Equipo no encontrado' });

    if (tag && tag !== equipment.tag) {
      const existing = await prisma.equipment.findUnique({
        where: {
          roomId_tag: {
            roomId: equipment.roomId,
            tag: tag as string
          }
        }
      });

      if (existing) {
        return res.status(409).json({ error: 'Ya existe un equipo en esta posición (tag duplicado)' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const eq = await tx.equipment.update({
        where: { id },
        data: {
          ...(tag && { tag: tag as string }),
          ...(type && { type }),
          ...(status && { status })
        }
      });

      await tx.equipmentLog.create({
        data: {
          action: 'UPDATE',
          equipmentId: eq.id,
          userId,
          details: JSON.stringify({
            old: { tag: equipment.tag, type: equipment.type, status: equipment.status },
            new: { tag: eq.tag, type: eq.type, status: eq.status }
          })
        }
      });

      return eq;
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error en updateEquipment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteEquipment = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user.id as string;

    const equipment = await prisma.equipment.findUnique({ where: { id } });
    if (!equipment) return res.status(404).json({ error: 'Equipo no encontrado' });

    await prisma.$transaction(async (tx) => {
      await tx.equipment.delete({ where: { id } });

      await tx.equipmentLog.create({
        data: {
          action: 'DELETE',
          equipmentId: id,
          userId,
          details: JSON.stringify({ tag: equipment.tag, type: equipment.type })
        }
      });
    });

    return res.status(200).json({ message: 'Equipo eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteEquipment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
