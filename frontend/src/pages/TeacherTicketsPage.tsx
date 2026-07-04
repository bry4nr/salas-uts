import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, Wrench, FileText, Ticket as TicketIcon, MessageSquare, Send, X, Loader2, RefreshCw } from 'lucide-react';
import type { Ticket, TicketStatus, ChatMessage } from '../types/ticket';
import api from '../api/axios';
import bgReportes from '../assets/bg-reportes.png';
import logoUts from '../assets/logo-uts.png';

interface Props {
  onBack: () => void;
}

// Subcomponente: Línea de tiempo visual para el estado del ticket
const TicketTimeline = ({ status }: { status: TicketStatus }) => {
  const steps = [
    { title: 'Reportado', icon: FileText, isActive: true },
    { title: 'En Revisión', icon: Wrench, isActive: status === 'En Revisión' || status === 'Resuelto' },
    { title: 'Resuelto', icon: CheckCircle2, isActive: status === 'Resuelto' },
  ];

  // Calcula el ancho de la línea de progreso verde
  const progressWidth = status === 'Pendiente' ? '0%' : status === 'En Revisión' ? '50%' : '100%';

  return (
    <div className="relative flex items-start justify-between w-full mt-6 pt-2">
      {/* Línea de fondo (gris) */}
      <div className="absolute top-6 left-0 w-full h-1 bg-gray-800/60 -z-10 rounded-full"></div>
      {/* Línea de progreso (verde UTS) */}
      <div 
        className="absolute top-6 left-0 h-1 bg-uts-green -z-10 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(26,103,50,0.8)]" 
        style={{ width: progressWidth }}
      ></div>

      {steps.map((step, idx) => (
        <div key={idx} className="flex flex-col items-center bg-transparent px-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
            step.isActive ? 'bg-uts-green text-white shadow-[0_0_12px_rgba(26,103,50,0.6)] border border-uts-green' : 'bg-gray-800/80 backdrop-blur-sm text-gray-400 border border-gray-700/50'
          }`}>
            <step.icon size={18} />
          </div>
          <span className={`text-xs font-semibold mt-2 drop-shadow-sm ${step.isActive ? 'text-gray-100' : 'text-gray-400'}`}>
            {step.title}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TeacherTicketsPage({ onBack }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados del Chat
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
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
    // Consider user is scrolling if they are more than 50px away from the bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    isUserScrollingRef.current = !isAtBottom;
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  const fetchMyTickets = async (showRefreshLoading = false) => {
    if (showRefreshLoading) setIsRefreshing(true);
    try {
      const res = await api.get('/tickets/my-tickets?role=docente');
      const data = res.data;
      
      const mappedTickets: Ticket[] = data.map((t: any) => ({
        id: t.id,
        location: `${t.room?.name || 'Sala'} - ${t.equipment?.tag || 'General'}`,
        room: t.room?.name || '',
        device: t.equipment?.tag || 'General',
        failureType: t.category,
        comment: t.description,
        status: t.status === 'PENDING' ? 'Pendiente' : t.status === 'IN_PROGRESS' ? 'En Revisión' : 'Resuelto',
        reportedAt: t.created_at,
        reportedBy: 'Yo',
      }));
      setTickets(mappedTickets);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMessages = async (ticketId: string, showLoading = false) => {
    if (showLoading) setIsRefreshingMessages(true);
    try {
      const res = await api.get(`/tickets/${ticketId}/messages`);
      setMessages(res.data);
      // Wait for render then scroll (if not scrolling up)
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (error) {
      console.error(error);
      setMessages([]);
    } finally {
      setIsRefreshingMessages(false);
    }
  };

  const openChat = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    isUserScrollingRef.current = false; // Reset scrolling state
    if (ticket.status !== 'Resuelto') {
      fetchMessages(ticket.id);
    } else {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setIsSendingMessage(true);
    try {
      const res = await api.post(`/tickets/${selectedTicket.id}/messages`, { text: newMessage, role: 'docente' });
      const newMsg = res.data;
      isUserScrollingRef.current = false; // Force scroll to bottom on our own message
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6 md:p-8 overflow-x-hidden flex flex-col bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: `url(${bgReportes})` }}
    >
      <div className="absolute inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-0"></div>

      <div className="max-w-4xl mx-auto w-full mb-8 relative z-10 flex justify-between items-start">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 sm:px-4 py-2 rounded-lg bg-gray-900/50 hover:bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 w-fit mb-6 shadow-sm text-sm sm:text-base"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Volver al Dashboard</span>
            <span className="sm:hidden">Volver</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-uts-green/20 text-uts-green rounded-xl backdrop-blur-sm border border-uts-green/30">
                <TicketIcon size={28} />
              </div>
              <h1 className="text-3xl font-bold text-uts-gold drop-shadow-sm">Mis Reportes</h1>
            </div>
            <button 
              onClick={() => fetchMyTickets(true)}
              disabled={isRefreshing}
              className="p-2 w-fit text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/80 rounded-lg transition-colors border border-gray-700/50 disabled:opacity-50 sm:ml-4"
              title="Actualizar reportes"
            >
              <RefreshCw size={20} className={isRefreshing ? "animate-spin text-uts-green" : ""} />
            </button>
          </div>
          <p className="text-gray-300 drop-shadow-sm mt-2 sm:mt-0">Haz seguimiento a las incidencias que has reportado en las salas.</p>
        </div>
        <img src={logoUts} alt="Logo UTS" className="h-12 object-contain drop-shadow-md hidden md:block" />
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6 relative z-10">
        {tickets.length === 0 && !isLoading ? (
          <div className="p-10 text-center text-gray-300 bg-uts-dark-card/80 backdrop-blur-sm rounded-uts-card border border-gray-800/50 shadow-lg drop-shadow-sm">No has reportado ningún ticket aún.</div>
        ) : tickets.map((ticket, index) => (
          <motion.div 
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
            className="bg-uts-dark-card/80 backdrop-blur-md border border-gray-800/50 p-6 rounded-uts-card shadow-lg"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-700/50 pb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm text-uts-gold font-bold drop-shadow-sm">#TKT-{ticket.id.substring(0, 6).toUpperCase()}</span>
                  <span className="text-sm text-gray-300 font-medium flex items-center gap-1 drop-shadow-sm">
                    <Clock size={14} /> {new Date(ticket.reportedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-100 drop-shadow-sm">{ticket.failureType}</h3>
                <p className="text-uts-green font-medium text-sm mt-1 drop-shadow-sm">{ticket.location}</p>
                <p className="text-gray-300 mt-3 text-sm drop-shadow-sm">{ticket.comment}</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <button 
                  onClick={() => openChat(ticket)}
                  className="text-sm font-medium text-uts-green bg-uts-green/20 hover:bg-uts-green/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-full md:w-auto justify-center border border-uts-green/30 shadow-sm"
                >
                  <MessageSquare size={16} /> Ver Chat
                </button>
              </div>
            </div>
            
            {/* Renderizado de la línea de tiempo */}
            <TicketTimeline status={ticket.status} />
          </motion.div>
        ))}
      </div>

      {/* Modal de Chat para el Docente */}
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
                  <div className="flex-1 flex justify-between items-center mr-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-100 drop-shadow-sm">Chat - #TKT-{selectedTicket.id.substring(0, 6).toUpperCase()}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 drop-shadow-sm">{selectedTicket.location}</p>
                    </div>
                    {selectedTicket.status !== 'Resuelto' && (
                      <button 
                        onClick={() => fetchMessages(selectedTicket.id, true)}
                        disabled={isRefreshingMessages}
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                        title="Actualizar mensajes"
                      >
                        <RefreshCw size={16} className={isRefreshingMessages ? "animate-spin text-uts-green" : ""} />
                      </button>
                    )}
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col min-h-[300px] sm:min-h-[400px]">
                  {selectedTicket.status === 'Resuelto' ? (
                    <div className="flex-1 flex items-center justify-center bg-uts-dark-card/50 rounded-xl border border-gray-800/60 text-gray-400 text-sm p-6 text-center drop-shadow-sm">
                      Este ticket ha sido resuelto. El historial del chat ha sido eliminado para optimizar el sistema.
                    </div>
                  ) : (
                    <>
                      <div 
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 bg-uts-dark-card/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 overflow-y-auto mb-4 flex flex-col gap-3 shadow-inner"
                      >
                        {messages.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm my-auto drop-shadow-sm">Aún no hay mensajes. El equipo de soporte te contactará por aquí.</p>
                        ) : messages.map(msg => (
                          <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.sender.role === 'DOCENTE' ? 'self-end items-end' : 'self-start items-start'}`}>
                            <span className="text-[10px] text-gray-400 mb-1 drop-shadow-sm">{msg.sender.name}</span>
                            <div className={`px-4 py-2 rounded-xl text-sm shadow-md ${msg.sender.role === 'DOCENTE' ? 'bg-uts-green text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe un mensaje al soporte..." className="flex-1 bg-uts-dark-card/90 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-2 text-gray-100 focus:outline-none focus:border-uts-green shadow-inner" />
                        <button onClick={handleSendMessage} disabled={!newMessage.trim() || isSendingMessage} className="bg-uts-green text-white px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center shadow-lg">
                          {isSendingMessage ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}