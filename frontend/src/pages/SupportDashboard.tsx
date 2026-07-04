import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Check, Clock, Wrench, Send, X, Save, Loader2, CheckCircle2, BarChart3, ListFilter, Building, RefreshCw, Star } from 'lucide-react';
import type { Ticket, TicketStatus, ChatMessage } from '../types/ticket';
import api from '../api/axios';
import bgReportes from '../assets/bg-reportes.png';
import logoUts from '../assets/logo-uts.png';

interface Props {
  userRole: 'soporte';
  onLogout: () => void;
  onViewStats?: () => void;
  onViewRooms?: () => void;
}

// Configuración de estilos para los estados de los tickets
const statusConfig: Record<TicketStatus, { bg: string; text: string; Icon: any }> = {
  'Pendiente': { bg: 'bg-error-red/10', text: 'text-error-red', Icon: Clock },
  'En Revisión': { bg: 'bg-warning-orange/10', text: 'text-warning-orange', Icon: Wrench },
  'Resuelto': { bg: 'bg-ok-green/10', text: 'text-ok-green', Icon: Check },
};

// Componente para las tarjetas de métricas
const MetricCard = ({ title, value, color, Icon }: { title: string, value: number, color: string, Icon: any }) => (
  <div className={`bg-uts-dark-card/80 backdrop-blur-sm p-5 rounded-uts-card border border-gray-800/50 flex items-start justify-between shadow-lg`}>
    <div>
      <p className="text-sm text-gray-300 font-medium drop-shadow-sm">{title}</p>
      <p className="text-3xl font-bold text-gray-100 mt-1 drop-shadow-sm">{value}</p>
    </div>
    <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-')}/20 ${color} backdrop-blur-sm border border-${color.replace('text-', '')}/30`}>
      <Icon size={24} />
    </div>
  </div>
);

export default function SupportDashboard({ userRole, onLogout, onViewStats, onViewRooms }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Filtro de Pestañas: Activos vs Historial
  const [activeTab, setActiveTab] = useState<'ACTIVOS' | 'RESUELTOS'>('ACTIVOS');
  
  // Modal de Valoraciones
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // Estados del formulario de gestión
  const [editStatus, setEditStatus] = useState<TicketStatus>('Pendiente');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current && !isUserScrollingRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    isUserScrollingRef.current = !isAtBottom;
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  const fetchTickets = async (showRefreshLoading = false) => {
    if (showRefreshLoading) setIsRefreshing(true);
    try {
      const res = await api.get('/tickets');
      const data = res.data;
      
      // Mapeamos los datos de la base de datos al formato de nuestra UI
      const mappedTickets: Ticket[] = data.map((t: any) => ({
        id: t.id,
        location: `${t.room?.name || 'Sala'} - ${t.equipment?.tag || 'General'}`,
        room: t.room?.name || '',
        device: t.equipment?.tag || 'General',
        title: t.title, // Agregamos el título real que puso el docente
        failureType: t.category,
        comment: t.description,
        status: t.status === 'PENDING' ? 'Pendiente' : t.status === 'IN_PROGRESS' ? 'En Revisión' : 'Resuelto',
        reportedAt: t.created_at,
        reportedBy: t.creator?.name || 'Usuario',
        correoInstitucional: t.correoInstitucional,
        valoracionApp: t.valoracionApp
      }));
      setTickets(mappedTickets);
    } catch (error) {
      console.error(error);
      setToastMessage('Error al cargar tickets');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Cargar tickets reales desde el Backend
  useEffect(() => {
    fetchTickets();
  }, []);

  const pendingTickets = tickets.filter(t => t.status === 'Pendiente').length;
  const inReviewTickets = tickets.filter(t => t.status === 'En Revisión').length;
  const todayStr = new Date().toDateString();
  const resolvedToday = tickets.filter(t => t.status === 'Resuelto' && new Date(t.reportedAt).toDateString() === todayStr).length;

  const fetchMessages = async (ticketId: string, showLoading = false) => {
    if (showLoading) setIsRefreshingMessages(true);
    try {
      const res = await api.get(`/tickets/${ticketId}/messages`);
      setMessages(res.data);
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setIsRefreshingMessages(false);
    }
  };

  // Cargar el chat al abrir un ticket
  useEffect(() => {
    if (selectedTicket && selectedTicket.status !== 'Resuelto') {
      fetchMessages(selectedTicket.id);
    } else {
      setMessages([]);
    }
  }, [selectedTicket]);

  const openTicketModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setNewMessage('');
    setMessages([]);
    isUserScrollingRef.current = false;
  };

  // Filtrar los tickets según la pestaña seleccionada
  const filteredTickets = tickets.filter(t => 
    activeTab === 'ACTIVOS' ? t.status !== 'Resuelto' : t.status === 'Resuelto'
  );
  
  // Filtrar tickets que tienen valoración (para el Modal de Valoraciones Alpha)
  const feedbackTickets = tickets.filter(t => (t as any).valoracionApp);

  const handleSaveTicket = async () => {
    if (!selectedTicket) return;
    setIsSubmitting(true);
    
    // Traducir estado al formato de la Base de Datos
    const dbStatus = editStatus === 'Pendiente' ? 'PENDING' : editStatus === 'En Revisión' ? 'IN_PROGRESS' : 'RESOLVED';

    try {
      await api.patch(`/tickets/${selectedTicket.id}/status`, { status: dbStatus });

      // Actualizar estado local para UI instantánea
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: editStatus } : t));
      
      setToastMessage('Estado actualizado correctamente');
      setTimeout(() => setToastMessage(null), 3000);
      setSelectedTicket(null);
    } catch (error) {
      console.error(error);
      setToastMessage('Error al guardar el estado');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setIsSendingMessage(true);
    try {
      const res = await api.post(`/tickets/${selectedTicket.id}/messages`, { text: newMessage, role: 'soporte' });
      const newMsg = res.data;
      isUserScrollingRef.current = false; // Force scroll to bottom
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error(error);
      setToastMessage('Error al enviar el mensaje');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Sala', 'Equipo', 'Categoría', 'Descripción', 'Estado', 'Fecha', 'Reportado por', 'Correo', 'Valoración'];
      
      const csvRows = tickets.map(t => {
        return [
          t.id.substring(0, 6).toUpperCase(),
          t.room || 'General',
          t.device || 'General',
          t.failureType || '',
          (t.comment || '').replace(/"/g, '""'), // Escape comillas dobles
          t.status,
          new Date(t.reportedAt).toLocaleString(),
          t.reportedBy || '',
          (t as any).correoInstitucional || '',
          ((t as any).valoracionApp || '').replace(/"/g, '""')
        ].map(value => `"${value}"`).join(','); // Envolvemos todo en comillas por seguridad
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // BOM para UTF-8 en Excel
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_feedback_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToastMessage('Reporte descargado correctamente');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      setToastMessage('Error al exportar reporte');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: `url(${bgReportes})` }}
    >
      <div className="absolute inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-0"></div>

      {/* Header Profesional */}
      <header className="bg-uts-dark-card/90 border-b border-gray-800/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <img src={logoUts} alt="Logo UTS" className="h-10 object-contain drop-shadow-sm" />
            <h1 className="text-2xl font-bold text-uts-gold drop-shadow-sm hidden sm:block">Panel de Soporte</h1>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-gray-200 drop-shadow-sm">Técnico de Soporte</p>
              <p className="text-xs text-uts-green capitalize drop-shadow-sm">Rol: {userRole}</p>
            </div>
            <button 
              onClick={() => setIsFeedbackModalOpen(true)} 
              className="flex items-center gap-2 bg-uts-gold/20 hover:bg-uts-gold/30 text-uts-gold px-3 md:px-4 py-2 rounded-lg font-medium transition-colors border border-uts-gold/30 shadow-sm" 
              title="Valoraciones Alpha"
            >
              <Star size={18} /> <span className="hidden sm:inline">Valoraciones Alpha</span>
            </button>
            {onViewStats && (
              <button onClick={onViewStats} className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700 shadow-sm" title="Estadísticas">
                <BarChart3 size={18} /> <span className="hidden sm:inline">Estadísticas</span>
              </button>
            )}
            {onViewRooms && (
              <button onClick={onViewRooms} className="flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors border border-gray-700 shadow-sm" title="Gestión de Salas">
                <Building size={18} /> <span className="hidden sm:inline">Salas</span>
              </button>
            )}
            <button 
              onClick={onLogout}
              className="p-2 text-gray-300 hover:text-error-red hover:bg-error-red/20 rounded-lg transition-colors bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 shadow-sm"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        {/* Métricas Rápidas */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        >
          <MetricCard title="Tickets Pendientes" value={pendingTickets} color="text-error-red" Icon={Clock} />
          <MetricCard title="En Revisión" value={inReviewTickets} color="text-warning-orange" Icon={Wrench} />
          <MetricCard title="Resueltos Hoy" value={resolvedToday} color="text-ok-green" Icon={Check} />
        </motion.div>

        {/* Lista de Tickets */}
        <div className="bg-uts-dark-card/80 backdrop-blur-md border border-gray-800/50 rounded-2xl overflow-hidden shadow-xl">
          {/* Pestañas de Filtrado */}
          <div className="p-5 border-b border-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-uts-dark-card/50">
            <div className="flex items-center gap-2">
              <ListFilter size={20} className="text-uts-gold" />
              <h2 className="text-xl font-semibold text-gray-100 drop-shadow-sm">Gestión de Tickets</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => fetchTickets(true)}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/80 rounded-lg transition-colors border border-gray-700/50 disabled:opacity-50"
                title="Actualizar tickets"
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin text-uts-green" : ""} />
              </button>
              <div className="flex bg-uts-dark-bg/80 backdrop-blur-sm p-1 rounded-lg border border-gray-800/80 shadow-sm">
                <button 
                  onClick={() => setActiveTab('ACTIVOS')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'ACTIVOS' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Activos ({pendingTickets + inReviewTickets})
                </button>
                <button 
                  onClick={() => setActiveTab('RESUELTOS')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'RESUELTOS' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Historial
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-uts-green" size={32} /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 text-center text-gray-300 drop-shadow-sm">No hay tickets {activeTab === 'ACTIVOS' ? 'pendientes por revisar' : 'resueltos'} en este momento.</div>
          ) : (
            <ul className="divide-y divide-gray-800/50">
              {filteredTickets.map((ticket, index) => {
                const config = statusConfig[ticket.status];
                return (
                  <motion.li 
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + index * 0.05 } }}
                    className="p-5 hover:bg-uts-dark-bg/60 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Información Principal */}
                      <div className="w-full sm:flex-1 sm:min-w-[200px]">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-uts-gold font-bold">#TKT-{ticket.id.substring(0, 6).toUpperCase()}</span>
                          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.text} border border-${config.text.replace('text-', '')}/30`}>
                            <config.Icon size={14} />
                            {ticket.status}
                          </div>
                        </div>
                        {/* Título y Categoría (Mejorado visualmente) */}
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-semibold text-gray-100">{(ticket as any).title || 'Falla reportada'}</p>
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md border border-gray-700/50">{ticket.failureType}</span>
                        </div>
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-gray-200">{ticket.location}</span> • Reportado por: {ticket.reportedBy}
                        </p>
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{ticket.comment}</p>
                      </div>
                      
                      {/* Acciones */}
                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={() => openTicketModal(ticket)}
                          className="text-sm font-medium text-uts-green bg-uts-green/20 hover:bg-uts-green/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-uts-green/30 shadow-sm"
                        >
                          <Wrench size={16} /> Gestionar
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* Modal de Valoraciones Alpha */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackModalOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="bg-uts-dark-bg w-full max-w-4xl rounded-uts-card shadow-2xl border border-uts-gold/50 overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-800/60 bg-uts-dark-card/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-uts-gold/10 text-uts-gold rounded-lg">
                      <Star size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-100">Valoraciones Alpha</h3>
                      <p className="text-sm text-gray-400 font-medium">Opiniones de la versión de prueba</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  {feedbackTickets.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      No hay valoraciones registradas aún.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {feedbackTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-uts-dark-card border border-gray-700/50 rounded-xl p-4 shadow-sm hover:border-uts-gold/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-sm text-uts-gold font-bold">#TKT-{ticket.id.substring(0, 6).toUpperCase()}</span>
                            <span className="text-xs text-gray-500">{new Date(ticket.reportedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-200">{(ticket as any).correoInstitucional || 'Correo no provisto'}</p>
                            <p className="text-xs text-gray-400">Ticket asociado: {(ticket as any).title || 'Reporte de falla'}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <p className="text-sm text-gray-200 italic">"{(ticket as any).valoracionApp}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-6 border-t border-gray-800/60 bg-uts-dark-card/30 flex justify-end gap-3">
                   <button onClick={handleExportCSV} className="px-5 py-2.5 rounded-xl font-medium text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors flex items-center gap-2">
                    <Save size={18} /> Exportar CSV
                  </button>
                  <button onClick={() => setIsFeedbackModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Gestión de Ticket para Soporte */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="bg-uts-dark-bg/95 backdrop-blur-xl w-full max-w-2xl rounded-uts-card shadow-2xl border border-gray-700/60 overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/60 bg-uts-dark-card/50">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-100">Gestionar #TKT-{selectedTicket.id.substring(0, 6).toUpperCase()}</h3>
                    <p className="text-xs sm:text-sm text-gray-400">{selectedTicket.location}</p>
                    {((selectedTicket as any).correoInstitucional || (selectedTicket as any).valoracionApp) && (
                      <div className="mt-3 flex flex-col gap-1 text-xs sm:text-sm text-gray-300 bg-uts-dark-bg/50 p-3 rounded-lg border border-gray-700/50">
                        {(selectedTicket as any).correoInstitucional && <p><span className="text-uts-gold font-semibold">Correo:</span> {(selectedTicket as any).correoInstitucional}</p>}
                        {(selectedTicket as any).valoracionApp && <p><span className="text-uts-gold font-semibold">Valoración App:</span> {(selectedTicket as any).valoracionApp}</p>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors self-start">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
                    <div className="w-full flex-1 space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Estado del Ticket</label>
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                        className="w-full bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green cursor-pointer"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Revisión">En Revisión</option>
                        <option value="Resuelto">Resuelto</option>
                      </select>
                    </div>
                    <button disabled={isSubmitting} onClick={handleSaveTicket} className="btn-primary w-full sm:w-auto px-6 py-3 h-[50px]">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> <span className="sm:hidden">Guardar</span><span className="hidden sm:inline">Guardar Estado</span></>}
                    </button>
                  </div>

                  <div className="border-t border-gray-700/60 pt-4 sm:pt-6 flex flex-col flex-1 min-h-[300px]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-300">Chat de Soporte</label>
                      {selectedTicket.status !== 'Resuelto' && editStatus !== 'Resuelto' && (
                        <button 
                          onClick={() => fetchMessages(selectedTicket.id, true)}
                          disabled={isRefreshingMessages}
                          className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                          title="Actualizar mensajes"
                        >
                          <RefreshCw size={14} className={isRefreshingMessages ? "animate-spin text-uts-green" : ""} />
                        </button>
                      )}
                    </div>
                    {selectedTicket.status === 'Resuelto' || editStatus === 'Resuelto' ? (
                      <div className="flex-1 flex items-center justify-center bg-uts-dark-card/50 rounded-xl border border-gray-800/60 text-gray-500 text-sm p-6 text-center">
                        El chat se elimina permanentemente cuando el ticket es resuelto.
                      </div>
                    ) : (
                      <>
                        <div 
                          ref={chatContainerRef}
                          onScroll={handleScroll}
                          className="flex-1 bg-uts-dark-card border border-gray-800/60 rounded-xl p-4 overflow-y-auto mb-3 flex flex-col gap-3"
                        >
                          {messages.length === 0 ? (
                            <p className="text-center text-gray-500 text-sm my-auto">Inicia la conversación con el docente.</p>
                          ) : messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.sender.role === 'SOPORTE' ? 'self-end items-end' : 'self-start items-start'}`}>
                              <span className="text-[10px] text-gray-500 mb-1">{msg.sender.name}</span>
                              <div className={`px-4 py-2 rounded-xl text-sm ${msg.sender.role === 'SOPORTE' ? 'bg-uts-green text-white rounded-br-none shadow-md' : 'bg-gray-800 text-gray-200 rounded-bl-none shadow-md'}`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe un mensaje al docente..." className="flex-1 bg-uts-dark-card border border-gray-700 rounded-xl px-4 py-2 text-gray-100 focus:outline-none focus:border-uts-green" />
                          <button onClick={handleSendMessage} disabled={!newMessage.trim() || isSendingMessage} className="bg-uts-green text-white px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center shadow-lg">
                            {isSendingMessage ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast de Éxito Flotante */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-uts-glow flex items-center gap-3 font-semibold backdrop-blur-md ${toastMessage.includes('Error') ? 'bg-error-red/20 border border-error-red text-error-red' : 'bg-ok-green/20 border border-ok-green text-ok-green'}`}
          >
            <CheckCircle2 size={24} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}