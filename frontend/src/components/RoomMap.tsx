import { motion } from 'framer-motion';
import { Monitor, CheckCircle2, AlertCircle, AlertTriangle, MonitorOff } from 'lucide-react';
import type { RoomData, Device, DeviceStatus } from '../types/room';
import VideoBeamCard from './VideoBeamCard';

interface Props {
  roomData: RoomData;
  onDeviceClick?: (device: Device) => void;
  onGeneralReport?: (type: 'damage' | 'missing') => void;
}

const statusConfig: Record<DeviceStatus, { bg: string; text: string; border: string; hover: string; Icon: any }> = {
  ok: {
    bg: 'bg-ok-green/10',
    text: 'text-ok-green',
    border: 'border-ok-green/20',
    hover: 'hover:border-ok-green hover:shadow-uts-glow',
    Icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-warning-orange/10',
    text: 'text-warning-orange',
    border: 'border-warning-orange/20',
    hover: 'hover:border-warning-orange',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-error-red/10',
    text: 'text-error-red',
    border: 'border-error-red/20',
    hover: 'hover:border-error-red',
    Icon: AlertCircle,
  },
};

// Variantes de Framer Motion para el efecto cascada (Staggered Fade-in)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function RoomMap({ roomData, onDeviceClick, onGeneralReport }: Props) {
  const videoBeam = roomData.devices.find(d => d.type === 'videobeam');
  const pcs = roomData.devices.filter(d => d.type === 'pc');

  return (
    <motion.div 
      className="w-full max-w-5xl mx-auto flex flex-col gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Encabezado de la Sala */}
      <motion.div variants={itemVariants} className="text-center mb-4">
        <h2 className="text-3xl font-bold text-uts-gold">{roomData.name}</h2>
        <p className="text-gray-400 mt-1">{roomData.location}</p>
      </motion.div>

      {/* Tarjeta del Video Beam (Si existe) */}
      {videoBeam && (
        <div className="flex justify-center mb-6">
          <VideoBeamCard device={videoBeam} onClick={() => onDeviceClick?.(videoBeam)} />
        </div>
      )}

      {/* Grid del Plano Físico */}
      <div className="bg-uts-dark-card/50 p-3 sm:p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-800/50 w-full">
        <div 
          className="grid gap-x-2 sm:gap-x-6 md:gap-x-12 gap-y-4 sm:gap-y-6 md:gap-y-8 w-full" 
          style={{ gridTemplateColumns: `repeat(${roomData.cols || 1}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: roomData.rows || 0 }).map((_, rowIndex) => (
            Array.from({ length: roomData.cols || 0 }).map((_, colIndex) => {
              const row = rowIndex + 1;
              const col = colIndex + 1;
              // Encontrar los PCs que pertenecen a esta fila y columna (escritorio/isla)
              const deskPcs = pcs.filter(pc => pc.row === row && pc.col === col)
                                 .sort((a, b) => (a.pcIndex || 0) - (b.pcIndex || 0));

              return (
                <div key={`desk-${row}-${col}`} className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 md:gap-3 bg-gray-900/20 p-2 sm:p-3 rounded-lg md:rounded-xl border border-gray-800/30">
                  {deskPcs.length > 0 ? (
                    deskPcs.map(pc => {
                      const config = statusConfig[pc.status];
                      const { Icon } = config;
                      return (
                        <motion.div
                          key={pc.id}
                          variants={itemVariants}
                          onClick={() => onDeviceClick?.(pc)}
                          className={`flex flex-col items-center justify-center p-1 sm:p-2 md:p-4 w-[3.5rem] h-[4rem] sm:w-16 sm:h-20 md:w-24 md:h-28 rounded-lg md:rounded-uts-card border backdrop-blur-sm cursor-pointer transition-all duration-300 shadow-sm md:shadow-uts-shadow hover:-translate-y-1 hover:scale-105 ${config.bg} ${config.border} ${config.hover}`}
                        >
                          <Monitor className={`mb-1 md:mb-2 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 ${config.text}`} />
                          <span className="font-mono text-[9px] sm:text-xs md:text-sm font-bold text-gray-200 leading-none">{pc.id}</span>
                          <Icon className={`mt-1 w-3 h-3 sm:w-4 sm:h-4 ${config.text}`} />
                        </motion.div>
                      );
                    })
                  ) : (
                    // Espacio vacío para mantener el layout grid si no hay PCs en esa ubicación
                    <div className="w-full h-[4rem] sm:h-20 md:h-28 opacity-10 rounded-lg md:rounded-uts-card border border-dashed border-gray-600"></div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {/* Botones de Reporte General */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mt-2">
        <button 
          onClick={() => onGeneralReport?.('damage')}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-error-red/50 text-error-red font-semibold transition-all duration-300 hover:bg-error-red/10 hover:border-error-red hover:scale-105 active:scale-95"
        >
          <AlertTriangle size={20} />
          Reportar daño en la sala
        </button>
        
        <button 
          onClick={() => onGeneralReport?.('missing')}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-warning-orange/50 text-warning-orange font-semibold transition-all duration-300 hover:bg-warning-orange/10 hover:border-warning-orange hover:scale-105 active:scale-95"
        >
          <MonitorOff size={20} />
          Reportar equipo no encontrado
        </button>
      </motion.div>

    </motion.div>
  );
}