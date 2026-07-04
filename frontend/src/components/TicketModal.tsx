import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, AlertCircle, Info, Loader2 } from 'lucide-react';
import type { Device } from '../types/room';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reportTarget: string; // Ej: "PC A1-2", "Video Beam", "Sala General"
  device?: Device | null;
  roomId?: string;
  isOtherLocation?: boolean;
  onSubmit?: (ticketData: any) => void;
}

export default function TicketModal({ isOpen, onClose, reportTarget, device, roomId, isOtherLocation, onSubmit }: Props) {
  // Estados del formulario
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Media');
  
  // Nuevos estados añadidos
  const [otherBuilding, setOtherBuilding] = useState('');
  const [otherRoom, setOtherRoom] = useState('');
  const [correoInstitucional, setCorreoInstitucional] = useState('');
  const [valoracionApp, setValoracionApp] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { user } = useAuth();

  // Limpiar formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setCategory(''); setTitle(''); setDescription(''); setPriority('Media');
      setOtherBuilding(''); setOtherRoom(''); setCorreoInstitucional(''); setValoracionApp('');
      setSubmitError(null);
    }
  }, [isOpen]);

  // Lógica de Prevención de Duplicados
  const isDuplicate = device && device.status !== 'ok';
  const currentStatusText = device?.status === 'error' ? 'Falla General' : 'En Revisión';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Mapeamos las prioridades de UI (Español) a los Enums de Prisma (Inglés)
    const priorityMap: Record<string, string> = {
      'Baja': 'LOW',
      'Media': 'MEDIUM',
      'Alta': 'HIGH'
    };

    const payload = {
      roomId: roomId,
      equipmentId: device?.dbId || null,
      creatorId: user?.id,
      category,
      title,
      description,
      priority: priorityMap[priority] || 'MEDIUM',
      otherBuilding: isOtherLocation ? otherBuilding : undefined,
      otherRoom: isOtherLocation ? otherRoom : undefined,
      correoInstitucional,
      valoracionApp
    };

    try {
      const response = await api.post('/tickets', payload);
      const data = response.data;

      // Llama a RoomPage para mostrar el Toast y pintarlo de rojo
      onSubmit?.(data.ticket);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || err.message || 'Error al crear el ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay oscuro con desenfoque (Backdrop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Contenedor del Modal centrado */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-uts-dark-bg w-full max-w-lg rounded-uts-card shadow-2xl border border-gray-800/60 overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800/60 bg-uts-dark-card/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-orange/10 text-warning-orange rounded-lg">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-100">Reportar Incidencia</h3>
                    <p className="text-sm text-gray-400 font-medium">{reportTarget}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo del Modal (Formulario con scroll si es necesario) */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {isDuplicate ? (
                  <div className="bg-warning-orange/10 border border-warning-orange/20 rounded-xl p-5 flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-warning-orange/20 text-warning-orange rounded-full">
                      <Info size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-100">Reporte en Curso</h4>
                    <p className="text-gray-400 text-sm mb-2">
                      Este equipo ya tiene un reporte activo y está siendo atendido por soporte.
                    </p>
                    <span className="px-3 py-1 bg-warning-orange/20 text-warning-orange font-semibold rounded-lg text-sm">
                      Estado: {currentStatusText}
                    </span>
                  </div>
                ) : (
                <>
                  <form id="ticket-form" className="space-y-5" onSubmit={handleSubmit}>
                  
                  {/* Ubicación Personalizada (Solo si es Otros) */}
                  {isOtherLocation && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Edificio <span className="text-error-red">*</span>
                        </label>
                        <input 
                          type="text"
                          required
                          value={otherBuilding}
                          onChange={(e) => setOtherBuilding(e.target.value)}
                          placeholder="Ej: Biblioteca" 
                          className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Salón o Espacio <span className="text-error-red">*</span>
                        </label>
                        <input 
                          type="text"
                          required
                          value={otherRoom}
                          onChange={(e) => setOtherRoom(e.target.value)}
                          placeholder="Ej: Sala de Juntas" 
                          className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Campos condicionales para invitado alpha */}
                  {user?.email === 'invitado_alpha@uts.edu.co' && (
                    <>
                      {/* Input: Correo Institucional */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Correo Institucional <span className="text-error-red">*</span>
                        </label>
                        <input 
                          type="email"
                          required
                          value={correoInstitucional}
                          onChange={(e) => setCorreoInstitucional(e.target.value)}
                          placeholder="Ej: tu_correo@uts.edu.co" 
                          className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all"
                        />
                      </div>

                      {/* Textarea: Valoración de la app */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Valoración / Opinión de la app <span className="text-error-red">*</span>
                        </label>
                        <textarea 
                          required
                          rows={2}
                          value={valoracionApp}
                          onChange={(e) => setValoracionApp(e.target.value)}
                          placeholder="¿Qué opinas de esta nueva forma de reportar?"
                          className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all resize-none"
                        ></textarea>
                      </div>
                    </>
                  )}

                  {/* Select: Tipo de Incidencia */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Categoría del problema <span className="text-error-red">*</span>
                    </label>
                    <select 
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Selecciona una categoría...</option>
                      <option value="HARDWARE">Hardware (No enciende, Pantalla azul, etc.)</option>
                      <option value="SOFTWARE">Software (Falta programa, Error de SO)</option>
                      <option value="PERIFERICO">Periféricos (Mouse o teclado dañado/faltante)</option>
                      <option value="RED">Red (Sin internet, cable dañado)</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  {/* Input: Título Corto */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Título breve <span className="text-error-red">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Teclado no funciona" 
                      className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all"
                    />
                  </div>

                  {/* Textarea: Comentarios */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Descripción detallada <span className="text-error-red">*</span>
                    </label>
                    <textarea 
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe brevemente el problema encontrado..."
                      className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all resize-none"
                    ></textarea>
                  </div>

                  {/* Radio: Prioridad sugerida */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Prioridad sugerida (Opcional)
                    </label>
                    <div className="flex gap-4">
                      {['Baja', 'Media', 'Alta'].map(prio => (
                        <label key={prio} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="priority" 
                            value={prio}
                            checked={priority === prio}
                            onChange={(e) => setPriority(e.target.value)}
                            className="hidden" 
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${priority === prio ? 'border-uts-green' : 'border-gray-500 group-hover:border-gray-400'}`}>
                            {priority === prio && <div className="w-2 h-2 bg-uts-green rounded-full" />}
                          </div>
                          <span className={`text-sm ${priority === prio ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>{prio}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Drag and Drop: Evidencia */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Adjuntar evidencia (Opcional)
                    </label>
                    <div className="w-full border-2 border-dashed border-gray-700/50 bg-gray-800/20 rounded-xl p-6 flex flex-col items-center justify-center gap-2 opacity-60 cursor-not-allowed">
                      <div className="p-3 bg-gray-800 rounded-full text-gray-500">
                        <UploadCloud size={24} />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">Subida de imágenes en mantenimiento</p>
                      <p className="text-xs text-gray-500">Por límite de almacenamiento temporal</p>
                    </div>
                  </div>

                  </form>

                  {/* Mensaje de Error del Backend */}
                  {submitError && (
                    <div className="mt-4 p-3 bg-error-red/10 border border-error-red/30 rounded-xl text-error-red text-sm font-medium text-center flex items-center justify-center gap-2">
                      <AlertCircle size={18} />
                      {submitError}
                    </div>
                  )}
                </>
                )}
              </div>

              {/* Footer del Modal (Botones) */}
              <div className="p-6 border-t border-gray-800/60 bg-uts-dark-card/30 flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                {!isDuplicate && (
                  <button 
                    form="ticket-form" 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-primary px-6 py-2.5 shadow-uts-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Enviando...</> : 'Enviar Reporte'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}