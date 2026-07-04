import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRoomByName = async (req: Request, res: Response) => {
  try {
    const name = req.params.name as string;

    const room = await prisma.room.findFirst({
      where: {
        OR: [
          { id: name },
          { name: name }
        ]
      },
      include: { equipments: true } // Traemos todos los equipos (PCs y Video Beam)
    });

    if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

    return res.status(200).json(room);
  } catch (error) {
    console.error('Error en getRoomByName:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};