import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type LayoutConfig = number[][];

// Data real 
const layoutsB: Record<string, LayoutConfig> = {
  "Sala 301B": [[3, 3, 3, 2, 3, 3], [4, 3, 4, 3, 4, 3]],
  "Sala 302B": [[3, 3, 3, 2, 3, 3], [4, 3, 4, 3, 4, 3]],
  "Sala 303B": [[4, 4, 4], [2, 3, 3]],
  "Sala 304B": [[3, 3, 3], [4, 4, 4]],
  "Sala 305B": [[4, 4, 4], [3, 3, 3]],
  "Sala 306B": [[3, 3, 3], [4, 4, 4]],
  "Sala 307B": [[4, 4, 4, 3, 4], [3, 3, 3, 3, 3]],
  "Sala 308B": [[3, 3, 3], [4, 4, 0]], 
  "Sala 309B": [[4, 4, 4], [3, 3, 3]],
  "Sala 310B": [[3, 3, 3], [4, 4, 4]],
  "Sala 311B": [[4, 4, 4], [3, 3, 3]],
  "Sala 312B": [[3, 3, 3], [2, 4, 4]],
  "Sala 313B": [[3, 4, 4], [3, 3, 3]],
  "Sala 314B": [[2, 3, 3], [3, 4, 4]],
  "Sala 315B": [[3, 3, 3], [3, 3, 2]],
  "Sala 316B": [[3, 3, 3], [3, 3, 2]],
};

const layoutsA: Record<string, LayoutConfig> = {
  "Sala 301A": [[3, 3, 3, 3, 4, 3], [3, 3, 3, 4, 4, 4]],
  "Sala 302A": [[3, 3, 3, 3, 4, 3], [3, 3, 3, 4, 4, 4]],
  "Sala 303A": [[3, 2, 3], [3, 3, 3]],
  "Sala 304A": [[4, 4, 4], [3, 3, 3]],
  "Sala 305A": [[4, 4, 4], [3, 3, 2]],
  "Sala 306A": [[4, 4, 3], [3, 3, 3]],
  "Sala 307A": [[4, 4, 3], [3, 3, 3]],
  "Sala 308A": [[4, 4, 3], [3, 3, 3]],
  "Sala 309A": [[4, 4, 4], [3, 3, 3]],
  "Sala 310A": [[4, 4, 4], [3, 3, 3]],
  "Sala 311A": [[4, 4, 3], [3, 3, 3]],
  "Sala 312A": [[4, 4, 4], [4, 4, 2]],
  "Sala 313A": [[5, 4, 4], [5, 5, 5]],
  "Sala 314A": [[5, 5, 5], [3, 3, 3]],
  "Sala 315A": [[4, 4, 2, 4, 4, 4], [4, 4, 3, 2, 2, 2]],
  "Sala 316A": [[4, 4, 2, 4, 4, 4], [4, 4, 3, 2, 2, 2]],
  "Sala 317A": [[4, 3, 3, 3, 2]], 
};

async function main() {
  console.log('Iniciando limpieza de la base de datos...');
  // Limpiar tablas (El orden importa por las relaciones de llaves foráneas)
  await prisma.ticket.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  console.log('Base de datos limpia.');

  console.log('Creando usuarios de prueba...');
  const hashedPasswordDocente = await bcrypt.hash('123456', 10);
  const hashedPasswordSoporte = await bcrypt.hash('12345', 10);

  await prisma.user.createMany({
    data: [
      { email: 'docente@uts.edu.co', password: hashedPasswordDocente, name: 'Profesor Carlos', role: 'DOCENTE' },
      { email: 'soporte@uts.edu.co', password: hashedPasswordSoporte, name: 'Técnico Admin', role: 'SOPORTE' },
    ]
  });

  const allLayouts = { ...layoutsA, ...layoutsB };
  let totalEquipments = 0;

  console.log('Sembrando salas y equipos...');
  for (const [roomName, columns] of Object.entries(allLayouts)) {
    const building = roomName.slice(-1); // "A" o "B"
    let maxRows = 0;

    // Calcular máximo de filas para la tabla Room
    columns.forEach(col => { if (col.length > maxRows) maxRows = col.length; });

    // 1. Crear Sala
    const room = await prisma.room.create({
      data: {
        name: roomName,
        building: building,
        location: `Edificio ${building} • Piso 3`,
        rows: maxRows,
        cols: columns.length,
      }
    });

    // 2. Preparar Equipos de la sala (PCs)
    const equipmentsData: any[] = [];
    columns.forEach((colData, colIndex) => {
      const colLetter = String.fromCharCode(65 + colIndex); // 0 -> A, 1 -> B
      
      colData.forEach((pcCount, rowIndex) => {
        const rowNum = rowIndex + 1;
        for (let i = 0; i < pcCount; i++) {
          equipmentsData.push({
            roomId: room.id,
            tag: `${colLetter}${rowNum}-${i + 1}`,
            type: 'PC',
            status: 'OK'
          });
        }
      });
    });

    // 3. Añadir el Video Beam y guardar todo
    equipmentsData.push({ roomId: room.id, tag: 'VB-1', type: 'VIDEO_BEAM', status: 'OK' });
    await prisma.equipment.createMany({ data: equipmentsData });
    totalEquipments += equipmentsData.length;
  }

  console.log(`¡Seed completado con éxito! Se crearon ${Object.keys(allLayouts).length} salas y ${totalEquipments} equipos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());