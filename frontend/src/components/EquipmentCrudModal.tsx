import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import type { Device } from '../types/room';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null; // Si es null, es modo Crear
  roomCols: number;
  roomRows: number;
  onSave: (data: any) => Promise<void>;
  onDelete?: (deviceId: string) => Promise<void>;
}

export default function EquipmentCrudModal({ isOpen, onClose, device, roomCols, roomRows, onSave, onDelete }: Props) {
  const [row, setRow] = useState(1);
  const [col, setCol] = useState(1);
  const [pcIndex, setPcIndex] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (device && device.type === 'pc') {
      setRow(device.row || 1);
      setCol(device.col || 1);
      setPcIndex(device.pcIndex || 1);
    } else {
      setRow(1);
      setCol(1);
      setPcIndex(1);
    }
    setShowConfirmDelete(false);
  }, [device, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({ row, col, pcIndex });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!device || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(device.dbId as string);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-uts-dark-bg/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
        >
          {showConfirmDelete ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-error-red/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-error-red" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">¿Eliminar este equipo?</h2>
              <p className="text-gray-400 mb-6">Esta acción es irreversible y eliminará el equipo del sistema.</p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl font-medium text-white bg-error-red hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <><Trash2 size={18} /> Eliminar</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-100">
                  {device ? `Editar Equipo ${device.id}` : 'Nuevo Equipo'}
                </h2>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Columna (X)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={roomCols} 
                      value={col} 
                      onChange={(e) => setCol(parseInt(e.target.value))}
                      className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-2 text-gray-100 focus:outline-none focus:border-uts-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Fila (Y)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={roomRows} 
                      value={row} 
                      onChange={(e) => setRow(parseInt(e.target.value))}
                      className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-2 text-gray-100 focus:outline-none focus:border-uts-green"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Índice en la Isla (Ej: 1, 2, 3...)</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={pcIndex} 
                    onChange={(e) => setPcIndex(parseInt(e.target.value))}
                    className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-2 text-gray-100 focus:outline-none focus:border-uts-green"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">El número de PC dentro del mismo escritorio.</p>
                </div>

                <div className="flex gap-3 mt-6">
                  {device && onDelete && (
                    <button 
                      type="button"
                      onClick={() => setShowConfirmDelete(true)}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 bg-error-red/20 text-error-red hover:bg-error-red/30 py-3 rounded-xl transition-colors font-medium border border-error-red/30 disabled:opacity-50"
                    >
                      <Trash2 size={18} /> Eliminar
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Guardar</>}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
