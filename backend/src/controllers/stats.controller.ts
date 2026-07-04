import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Construir el filtro de fechas (Si el usuario los envía)
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    // Aplicar el filtro de fecha solo si tiene propiedades
    const ticketWhere = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};

    // Ejecutamos las promesas en paralelo para mayor velocidad
    const [totalTickets, categoryGroup, roomsWithCounts, topRoomsRaw] = await Promise.all([
      
      // A. Total de tickets en el periodo
      prisma.ticket.count({ where: ticketWhere }),

      // B. Distribución por Categoría (Usando agrupación directa de SQL)
      prisma.ticket.groupBy({
        by: ['category'],
        _count: { id: true },
        where: ticketWhere,
      }),

      // C. Comparativa por Edificios (Consultamos las salas y sumamos sus tickets filtrados)
      prisma.room.findMany({
        select: {
          building: true,
          _count: { select: { tickets: { where: ticketWhere } } }
        }
      }),

      // D. Top 5 Salas con más fallos (Ordenadas por la cantidad de tickets)
      prisma.room.findMany({
        select: {
          name: true,
          _count: { select: { tickets: { where: ticketWhere } } }
        },
        orderBy: {
          tickets: { _count: 'desc' }
        },
        take: 5
      })
    ]);

    // Formatear los resultados para que el Frontend los consuma fácilmente
    const distributionByCategory = categoryGroup.map(item => ({
      category: item.category,
      count: item._count.id
    }));

    // Agrupar y sumar los tickets por edificio en memoria (Súper eficiente ya que son pocas salas)
    const buildingComparison = roomsWithCounts.reduce((acc, room) => {
      acc[room.building] = (acc[room.building] || 0) + room._count.tickets;
      return acc;
    }, {} as Record<string, number>);

    const topRooms = topRoomsRaw.map(room => ({
      room: room.name,
      count: room._count.tickets
    }));

    return res.status(200).json({
      totalTickets,
      distributionByCategory,
      buildingComparison,
      topRooms
    });

  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    return res.status(500).json({ error: 'Error interno del servidor al calcular estadísticas' });
  }
};