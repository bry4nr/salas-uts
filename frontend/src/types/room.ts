export type DeviceStatus = 'ok' | 'error' | 'warning';
export type DeviceType = 'pc' | 'videobeam';

export interface Device {
  id: string;
  dbId?: string;
  type: DeviceType;
  status: DeviceStatus;
  row?: number;
  col?: number;
  pcIndex?: number;
}

export interface RoomData {
  name: string;
  location: string;
  rows: number;
  cols: number;
  devices: Device[];
}