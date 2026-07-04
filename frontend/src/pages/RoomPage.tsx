import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, CheckCircle2, Plus, Edit2, Trash2, X, Save, Loader2 } from 'lucide-react';
import RoomMap from '../components/RoomMap';
import TicketModal from '../components/TicketModal';
import EquipmentCrudModal from '../components/EquipmentCrudModal';
import type { RoomData, Device } from '../types/room';
import api from '../api/axios';
import bgSalas from '../assets/bg-salas.png';
import logoUts from '../assets/logo-uts.png';
import { useAuth } from '../context/AuthContext';

interface Props {
  roomData: RoomData;
  onBack: () => void;
}

export default function RoomPage({ roomData, onBack }: Props) {
  const { user } = useAuth();
  const [roomState, setRoomState] = useState<RoomData>(roomData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [reportTarget, setReportTarget] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Contar cuántos equipos no están en estado 'ok'
  const activeReportsCount = roomState.devices.filter(d => d.status !== 'ok').length;
  
  const fetchRoomData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Hacemos la petición a nuestra API
      const response = await api.get(`/salones/${encodeURIComponent(roomData.name)}`);
      const data = response.data;
      
      // Mapeamos los equipos de la Base de Datos a la estructura del Frontend
      const mappedDevices: Device[] = data.equipments.map((eq: any) => {
        // Traducimos los estados de DB a la UI
        let status: 'ok' | 'warning' | 'error' = 'ok';
        if (eq.status === 'REPORTED') status = 'error';
        if (eq.status === 'IN_MAINTENANCE') status = 'warning';

        if (eq.type === 'VIDEO_BEAM') {
          return { id: eq.tag, type: 'videobeam', status };
        }

        // Extraemos columna, fila y número de PC desde el tag (Ej: "A1-2")
        const colLetter = eq.tag.charAt(0);
        const col = colLetter.charCodeAt(0) - 64; // A -> 1, B -> 2
        const [rowStr, indexStr] = eq.tag.substring(1).split('-');

        return {
          id: eq.tag,
          dbId: eq.id,
          type: 'pc',
          status,
          row: parseInt(rowStr, 10),
          col: col,
          pcIndex: parseInt(indexStr, 10)
        };
      });

      setRoomState({ ...data, devices: mappedDevices });
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [roomData.name]);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    if (user?.role === 'SOPORTE' && device.type === 'pc') {
      setIsCrudModalOpen(true);
    } else {
      setReportTarget(device.type === 'videobeam' ? 'Video Beam Principal' : `PC ${device.id}`);
      setIsModalOpen(true);
    }
  };

  const handleAddEquipment = () => {
    setSelectedDevice(null);
    setIsCrudModalOpen(true);
  };

  const handleSaveEquipment = async (data: { row: number, col: number, pcIndex: number }) => {
    const colLetter = String.fromCharCode(64 + data.col);
    const tag = `${colLetter}${data.row}-${data.pcIndex}`;

    // Validar si la posición ya está ocupada
    const isOccupied = roomState.devices.some(d => d.id === tag && d.dbId !== selectedDevice?.dbId);
    if (isOccupied) {
      alert('Ya existe un equipo en esta posición (Fila, Columna, Índice).');
      throw new Error('Posición ocupada');
    }

    try {
      if (selectedDevice) {
        // Editar equipo existente
        await api.patch(`/equipments/${selectedDevice.dbId}`, { tag, type: 'PC' });
        setToastMessage('Equipo actualizado exitosamente');
      } else {
        // Crear nuevo equipo
        await api.post(`/salones/${(roomState as any).id}/equipments`, { tag, type: 'PC' });
        setToastMessage('Equipo creado exitosamente');
      }
      setTimeout(() => setToastMessage(null), 3000);
      fetchRoomData(); // Recargar datos para asegurar consistencia
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Ocurrió un error al guardar el equipo.';
      setToastMessage(`error: ${errorMsg}`);
      setTimeout(() => setToastMessage(null), 5000);
      throw error;
    }
  };

  const handleDeleteEquipment = async (deviceId: string) => {
    try {
      await api.delete(`/equipments/${deviceId}`);
      setToastMessage('Equipo eliminado exitosamente');
      setTimeout(() => setToastMessage(null), 3000);
      fetchRoomData();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Ocurrió un error al eliminar el equipo.';
      setToastMessage(`error: ${errorMsg}`);
      setTimeout(() => setToastMessage(null), 5000);
      throw error;
    }
  };

  const handleGeneralReport = (type: 'damage' | 'missing') => {
    setSelectedDevice(null);
    setReportTarget(type === 'damage' ? 'Daño General en la sala' : 'Equipo no encontrado');
    setIsModalOpen(true);
  };

  const handleSubmitTicket = (_ticketData: any) => {
    // Al enviar, actualizamos el estado visual del equipo a 'error' (Reportado)
    if (selectedDevice) {
      setRoomState(prev => ({
        ...prev,
        devices: prev.devices.map(d => d.id === selectedDevice.id ? { ...d, status: 'error' } : d)
      }));
    }
    
    setToastMessage('Ticket creado exitosamente');
    setTimeout(() => setToastMessage(null), 3000);
    setIsModalOpen(false);
  };

  // Vista de Skeleton Loader mientras carga la data real
  if (isLoading) {
    return (
      <div 
        className="min-h-screen p-6 md:p-8 flex flex-col items-center justify-start overflow-x-hidden relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${bgSalas})` }}
      >
        <div className="absolute inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-0"></div>
        <div className="w-full max-w-5xl mb-6 flex justify-start relative z-10">
          <button className="flex items-center gap-2 text-gray-500 cursor-not-allowed px-4 py-2 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
            <ArrowLeft size={20} /><span>Cargando sala...</span>
          </button>
        </div>
        <div className="w-64 h-10 bg-gray-800/50 animate-pulse rounded-xl mb-4 relative z-10"></div>
        <div className="w-48 h-6 bg-gray-800/50 animate-pulse rounded-lg mb-12 relative z-10"></div>
        <div className="bg-uts-dark-card/60 backdrop-blur-md p-3 sm:p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-800/50 w-full max-w-5xl relative z-10 shadow-2xl">
          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-6 md:gap-x-12 gap-y-4 sm:gap-y-6 md:gap-y-8 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 md:gap-3 bg-gray-900/20 p-2 sm:p-3 rounded-lg md:rounded-xl border border-gray-800/30">
                <div className="w-[3.5rem] h-[4rem] sm:w-16 sm:h-20 md:w-24 md:h-28 bg-gray-800/40 animate-pulse rounded-lg md:rounded-uts-card border border-gray-700/30"></div>
                <div className="w-[3.5rem] h-[4rem] sm:w-16 sm:h-20 md:w-24 md:h-28 bg-gray-800/40 animate-pulse rounded-lg md:rounded-uts-card border border-gray-700/30"></div>
                <div className="w-[3.5rem] h-[4rem] sm:w-16 sm:h-20 md:w-24 md:h-28 bg-gray-800/40 animate-pulse rounded-lg md:rounded-uts-card border border-gray-700/30"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vista de Error estilizada
  if (error) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${bgSalas})` }}
      >
        <div className="absolute inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-0"></div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-error-red/10 border border-error-red/30 p-8 rounded-2xl max-w-md w-full shadow-uts-glow relative z-10 backdrop-blur-md">
          <AlertCircle size={56} className="text-error-red mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-100 mb-2 drop-shadow-sm">¡Ups! Algo salió mal</h2>
          <p className="text-gray-300 mb-8">{error}</p>
          <button onClick={onBack} className="btn-primary w-full shadow-lg text-sm sm:text-base">
            <ArrowLeft size={20} /> Volver al Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6 md:p-8 overflow-x-hidden relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${bgSalas})` }}
    >
      <div className="absolute inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-0"></div>

      <div className="max-w-5xl mx-auto mb-6 relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-4 w-full">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 sm:px-4 py-2 rounded-lg bg-gray-900/50 hover:bg-gray-800/80 backdrop-blur-sm w-fit border border-gray-700/50 shadow-lg text-sm sm:text-base"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Volver al Dashboard</span>
              <span className="sm:hidden">Volver</span>
            </button>
            
            {user?.role === 'SOPORTE' && (
              <button 
                onClick={handleAddEquipment}
                className="flex items-center gap-2 text-white bg-uts-green/80 hover:bg-uts-green px-3 sm:px-4 py-2 rounded-lg transition-colors shadow-lg border border-uts-green/50 text-sm sm:text-base"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Añadir Equipo</span>
                <span className="sm:hidden">Añadir</span>
              </button>
            )}
          </div>

          {/* Indicador de reportes activos en la sala */}
          {activeReportsCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-warning-orange/20 border border-warning-orange/40 text-warning-orange px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-lg"
            >
              <AlertCircle size={20} />
              <p className="font-medium text-sm">Hay <strong>{activeReportsCount} reportes activos</strong> en esta sala actualmente.</p>
            </motion.div>
          )}
        </div>
        <img src={logoUts} alt="Logo UTS" className="h-12 object-contain drop-shadow-md hidden md:block" />
      </div>
      
      <div className="relative z-10">
        <RoomMap roomData={roomState} onDeviceClick={handleDeviceClick} onGeneralReport={handleGeneralReport} />
      </div>

      <TicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        reportTarget={reportTarget}
        device={selectedDevice}
        roomId={(roomState as any).id}
        onSubmit={handleSubmitTicket}
      />

      <EquipmentCrudModal 
        isOpen={isCrudModalOpen}
        onClose={() => setIsCrudModalOpen(false)}
        device={selectedDevice}
        roomCols={roomState.cols}
        roomRows={roomState.rows}
        onSave={handleSaveEquipment}
        onDelete={handleDeleteEquipment}
      />

      {/* Toast de Éxito Flotante */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-uts-glow flex items-center gap-3 font-semibold backdrop-blur-md ${toastMessage.includes('error') ? 'bg-error-red/20 border border-error-red text-error-red' : 'bg-ok-green/20 border border-ok-green text-ok-green'}`}
          >
            {toastMessage.includes('error') ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}