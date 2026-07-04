import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Building2, DoorOpen, Ticket, ArrowLeft, CheckCircle2 } from 'lucide-react';
import bgDashboard from '../assets/bg-dashboard.png';
import logoUts from '../assets/logo-uts.png';
import TicketModal from '../components/TicketModal';

interface Props {
  userRole: 'docente' | 'soporte';
  onLogout: () => void;
  onSelectRoom: (roomName: string) => void;
  onViewTickets?: () => void;
}

const realRooms = {
  A: ['Sala 301A', 'Sala 302A', 'Sala 303A', 'Sala 304A', 'Sala 305A', 'Sala 306A', 'Sala 307A', 'Sala 308A', 'Sala 309A', 'Sala 310A', 'Sala 311A', 'Sala 312A', 'Sala 313A', 'Sala 314A', 'Sala 315A', 'Sala 316A', 'Sala 317A'],
  B: ['Sala 301B', 'Sala 302B', 'Sala 303B', 'Sala 304B', 'Sala 305B', 'Sala 306B', 'Sala 307B', 'Sala 308B', 'Sala 309B', 'Sala 310B', 'Sala 311B', 'Sala 312B', 'Sala 313B', 'Sala 314B', 'Sala 315B', 'Sala 316B']
};

export default function DashboardPage({ userRole, onLogout, onSelectRoom, onViewTickets }: Props) {
  const [selectedBuilding, setSelectedBuilding] = useState<'A' | 'B' | null>(null);
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmitOtherTicket = (_ticketData: any) => {
    setToastMessage('Ticket reportado exitosamente en otra ubicación');
    setTimeout(() => setToastMessage(null), 3000);
    setIsOtherModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: `url(${bgDashboard})` }}
    >
      <div className="absolute inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-0"></div>
      
      {/* Header Profesional */}
      <header className="bg-uts-dark-card/90 border-b border-gray-800/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <img src={logoUts} alt="Logo UTS" className="h-10 object-contain drop-shadow-sm" />
            <h1 className="text-2xl font-bold text-uts-gold drop-shadow-sm hidden sm:block">Salas UTS</h1>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-gray-200 drop-shadow-sm">Usuario de Prueba</p>
              <p className="text-xs text-uts-green capitalize drop-shadow-sm">Rol: {userRole}</p>
            </div>
            {userRole === 'docente' && onViewTickets && (
              <button 
                onClick={onViewTickets}
                className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700"
                title="Mis Reportes"
              >
                <Ticket size={18} /> <span className="hidden sm:inline">Mis Reportes</span>
              </button>
            )}
            {userRole === 'soporte' && onViewTickets && (
              <button 
                onClick={onViewTickets}
                className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700"
                title="Volver a Soporte"
              >
                <ArrowLeft size={18} /> <span className="hidden sm:inline">Volver</span>
              </button>
            )}
            <button 
              onClick={onLogout}
              className="p-2 text-gray-300 hover:text-error-red hover:bg-error-red/20 rounded-lg transition-colors bg-gray-900/50 backdrop-blur-sm"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 relative z-10">
        <h2 className="text-2xl font-semibold mb-6 text-gray-100 drop-shadow-sm">Selecciona un Edificio</h2>
        
        {/* Selección de Edificio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {(['A', 'B'] as const).map((building) => (
            <motion.button
              key={building}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedBuilding(building)}
              className={`p-8 rounded-uts-card border text-left transition-all duration-300 shadow-uts-shadow flex items-center justify-between backdrop-blur-sm ${
                selectedBuilding === building 
                  ? 'bg-uts-green/20 border-uts-green shadow-uts-glow' 
                  : 'bg-uts-dark-card/80 border-gray-800/50 hover:border-gray-600 hover:bg-uts-dark-card/90'
              }`}
            >
              <div>
                <h3 className="text-3xl font-bold text-gray-100 mb-2">Edificio {building}</h3>
                <p className="text-gray-400">Salas de cómputo y laboratorios</p>
              </div>
              <Building2 size={48} className={selectedBuilding === building ? 'text-uts-green' : 'text-gray-600'} />
            </motion.button>
          ))}
          
          <motion.button
            key="Otros"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOtherModalOpen(true)}
            className="p-8 rounded-uts-card border text-left transition-all duration-300 shadow-uts-shadow flex items-center justify-between backdrop-blur-sm bg-uts-dark-card/80 border-gray-800/50 hover:border-gray-600 hover:bg-uts-dark-card/90"
          >
            <div>
              <h3 className="text-3xl font-bold text-gray-100 mb-2">Otros</h3>
              <p className="text-gray-400">Reporte en otra ubicación</p>
            </div>
            <Ticket size={48} className="text-gray-600" />
          </motion.button>
        </div>

        {/* Selección de Sala (Aparece suavemente al elegir edificio) */}
        <AnimatePresence mode="wait">
          {selectedBuilding && (
            <motion.div
              key={`rooms-${selectedBuilding}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-100">Salas Disponibles - Edificio {selectedBuilding}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {realRooms[selectedBuilding].map((room) => (
                  <motion.button
                    key={room}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectRoom(room)}
                    className="card-uts p-6 flex flex-col items-center justify-center gap-3 hover:border-uts-gold/50 transition-colors group"
                  >
                    <DoorOpen size={32} className="text-gray-500 group-hover:text-uts-gold transition-colors" />
                    <span className="font-semibold text-lg text-gray-200">{room}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal para "Otros" (Ubicación Personalizada) */}
      <TicketModal 
        isOpen={isOtherModalOpen} 
        onClose={() => setIsOtherModalOpen(false)} 
        reportTarget="Ubicación Personalizada"
        isOtherLocation={true}
        onSubmit={handleSubmitOtherTicket}
      />

      {/* Toast de Éxito Flotante */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-uts-glow flex items-center gap-3 font-semibold backdrop-blur-md bg-ok-green/20 border border-ok-green text-ok-green"
          >
            <CheckCircle2 size={24} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}