import type { RoomData, Device, DeviceStatus } from '../types/room';

// Tipado interno para la configuración de las columnas (arreglos con cantidad de PCs por fila)
type LayoutConfig = number[][];

const generateRoom = (name: string, location: string, columns: LayoutConfig): RoomData => {
  const devices: Device[] = [];
  let maxRows = 0;

  columns.forEach((colData, colIndex) => {
    const colNum = colIndex + 1;
    const colLetter = String.fromCharCode(65 + colIndex); // A para Col 1, B para Col 2...
    if (colData.length > maxRows) maxRows = colData.length;

    colData.forEach((pcCount, rowIndex) => {
      const rowNum = rowIndex + 1;
      for (let i = 0; i < pcCount; i++) {
        const id = `${colLetter}${rowNum}-${i + 1}`;
        
        // Asignamos 'ok' por defecto.
        let status: DeviceStatus = 'ok';

        devices.push({
          id,
          type: 'pc',
          status,
          row: rowNum,
          col: colNum,
          pcIndex: i + 1
        });
      }
    });
  });

  // Todas las salas tienen Video Beam
  devices.push({ id: 'VB-1', type: 'videobeam', status: 'ok' });

  return {
    name,
    location,
    rows: maxRows,
    cols: columns.length,
    devices
  };
};

// Distribuciones basadas en la información proporcionada
const layoutsB: Record<string, LayoutConfig> = {
  "Sala 301B": [[3, 3, 3, 2, 3, 3], [4, 3, 4, 3, 4, 3]],
  "Sala 302B": [[3, 3, 3, 2, 3, 3], [4, 3, 4, 3, 4, 3]],
  "Sala 303B": [[4, 4, 4], [2, 3, 3]],
  "Sala 304B": [[3, 3, 3], [4, 4, 4]],
  "Sala 305B": [[4, 4, 4], [3, 3, 3]],
  "Sala 306B": [[3, 3, 3], [4, 4, 4]],
  "Sala 307B": [[4, 4, 4, 3, 4], [3, 3, 3, 3, 3]],
  "Sala 308B": [[3, 3, 3], [4, 4, 0]], // Fila 3 col 2 vacía asumiendo 0
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
  "Sala 317A": [[4, 3, 3, 3, 2]], // Solo una columna especificada
};

// Exportamos un objeto central con todas las salas generadas
export const roomsDatabase: Record<string, RoomData> = {};

Object.entries(layoutsB).forEach(([name, layout]) => {
  roomsDatabase[name] = generateRoom(name, "Edificio B • Piso 3", layout);
});

Object.entries(layoutsA).forEach(([name, layout]) => {
  roomsDatabase[name] = generateRoom(name, "Edificio A • Piso 3", layout);
});