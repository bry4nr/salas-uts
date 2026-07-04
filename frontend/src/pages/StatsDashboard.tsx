import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Activity, AlertTriangle, CheckCircle2, Clock, Loader2, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import bgReportes from '../assets/bg-reportes.png';
import logoUts from '../assets/logo-uts.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  onBack: () => void;
}

// Colores institucionales y de estado para las gráficas
const COLORS = ['#1A6732', '#FDBE33', '#3B82F6', '#FB923C', '#F87171'];

export default function StatsDashboard({ onBack }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [ticketsData, setTicketsData] = useState<any[]>([]);
  
  // Filtros de fecha
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      let url = '/stats/dashboard';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', `${startDate}T00:00:00.000Z`);
      if (endDate) params.append('endDate', `${endDate}T23:59:59.999Z`);
      if (params.toString()) url += `?${params.toString()}`;

      const [statsRes, ticketsRes] = await Promise.all([
        api.get(url),
        api.get('/tickets')
      ]);
      
      setStatsData(statsRes.data);
      
      const filteredT = ticketsRes.data.filter((t: any) => {
        const tDate = new Date(t.created_at);
        const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date(0);
        const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date(8640000000000000);
        return tDate >= start && tDate <= end;
      });
      setTicketsData(filteredT);
    } catch (error) {
      console.error("Error al cargar estadísticas", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-[-2]"
          style={{ backgroundImage: `url(${bgReportes})` }}
        ></div>
        <div className="fixed inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-[-1]"></div>
        <Loader2 className="animate-spin text-uts-green relative z-10" size={40} />
      </div>
    );
  }

  if (!statsData) return null;

  const resolvedCount = ticketsData.filter(t => t.status === 'RESOLVED').length;
  const pendingCount = ticketsData.filter(t => t.status === 'PENDING').length;
  const worstRoom = statsData.topRooms[0]?.room || 'N/A';

  const pieData = statsData.distributionByCategory.map((item: any) => ({
    name: item.category,
    value: item.count
  }));

  const barData = Object.entries(statsData.buildingComparison).map(([building, count]) => ({
    name: `Edificio ${building}`,
    tickets: count
  }));

  const otrosCount = ticketsData.filter(t => !t.room && !t.roomId).length;
  if (otrosCount > 0 || ticketsData.some(t => t.otherBuilding)) {
    barData.push({
      name: 'Otros',
      tickets: ticketsData.filter(t => !t.room && !t.roomId || t.otherBuilding).length
    });
  }

  const descargarPDF = async () => {
    const input = document.getElementById('reporte-pdf');
    if (!input) return;

    try {
      const canvas = await html2canvas(input, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff' 
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Reporte_Incidencias_UTS.pdf');
    } catch (error) {
      console.error('Error al generar el PDF', error);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-[-2]"
        style={{ backgroundImage: `url(${bgReportes})` }}
      ></div>
      <div className="fixed inset-0 bg-uts-dark-bg/85 backdrop-blur-[2px] z-[-1]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen p-6 md:p-8 flex flex-col relative text-gray-100"
      >
        <div id="reporte-pdf" className="relative max-w-7xl mx-auto w-full p-6 rounded-xl">
          {/* Marca de agua */}
          <img 
            src={logoUts} 
            className="absolute inset-0 m-auto w-1/2 opacity-10 z-0 pointer-events-none" 
            alt="Watermark UTS" 
          />
          
          <div className="relative z-10 bg-transparent flex flex-col w-full">
            {/* Cabecera */}
            <div className="w-full flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onBack}
                  data-html2canvas-ignore="true"
                  className="p-2 text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg bg-gray-900/50 hover:bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center"
                >
                  <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-4">
                  <img src={logoUts} alt="Logo UTS" className="h-12 object-contain drop-shadow-md hidden md:block" />
                  <div>
                    <h1 className="text-3xl font-bold text-uts-gold drop-shadow-sm">Análisis de Incidencias</h1>
                    <p className="text-gray-300 drop-shadow-sm">Oficina de Recursos Informáticos</p>
                    <p className="text-xs text-gray-400 mt-1 drop-shadow-sm">Reporte generado el: {new Date().toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={descargarPDF}
                data-html2canvas-ignore="true"
                className="btn-primary shadow-lg backdrop-blur-sm bg-uts-green/90 px-4 py-2 flex items-center gap-2 rounded-lg text-white"
              >
                <Printer size={20} /> Exportar Reporte
              </button>
            </div>

            {/* Barra de Filtros */}
            <div data-html2canvas-ignore="true" className="w-full mb-6 bg-uts-dark-card/80 backdrop-blur-md p-4 rounded-xl border border-gray-800/50 shadow-lg flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 drop-shadow-sm">Fecha Inicio</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-uts-dark-bg/80 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-uts-green backdrop-blur-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 drop-shadow-sm">Fecha Fin</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-uts-dark-bg/80 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-uts-green backdrop-blur-sm" />
              </div>
              <button 
                onClick={fetchAllData} 
                className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700 flex items-center gap-2"
              >
                <Filter size={16}/> Filtrar Resultados
              </button>
              {(startDate || endDate) && (
                <p className="text-sm text-uts-green ml-auto drop-shadow-sm font-medium">Filtro aplicado</p>
              )}
            </div>

            <div className="w-full space-y-6">
              {/* 4 Tarjetas de Métricas Clave */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Tickets" value={statsData.totalTickets} Icon={Activity} color="text-blue-400" />
                <MetricCard title="Tickets Resueltos" value={resolvedCount} Icon={CheckCircle2} color="text-green-500" />
                <MetricCard title="Tickets Pendientes" value={pendingCount} Icon={Clock} color="text-red-400" />
                <MetricCard title="Sala con más fallas" value={worstRoom} Icon={AlertTriangle} color="text-orange-400" isText />
              </div>

              {/* Contenedor de Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Gráfica de Pastel: Por Categoría */}
                <div className="bg-uts-dark-card/80 backdrop-blur-sm border border-gray-800/50 p-6 rounded-uts-card shadow-lg">
                  <h3 className="text-xl font-semibold mb-6 drop-shadow-sm">Distribución por Categoría</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          isAnimationActive={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 1.5; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return (<text x={x} y={y} fill="#FFFFFF" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12" fontWeight="bold">{`${name} ${(percent * 100).toFixed(0)}%`}</text>); }}
                        >
                          {pieData.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E1F21', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica de Barras: Comparativa de Edificios */}
                <div className="bg-uts-dark-card/80 backdrop-blur-sm border border-gray-800/50 p-6 rounded-uts-card shadow-lg">
                  <h3 className="text-xl font-semibold mb-6 drop-shadow-sm">Comparativa por Edificio</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#FFFFFF" />
                        <YAxis stroke="#FFFFFF" allowDecimals={false} />
                        <Tooltip 
                          cursor={{ fill: '#374151', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: '#1E1F21', borderColor: '#374151', borderRadius: '8px' }}
                        />
                        <Bar dataKey="tickets" name="Tickets Reportados" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                          {barData.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#1A6732' : '#FDBE33'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              <div className="bg-uts-dark-card/80 border border-gray-800/50 p-6 rounded-uts-card mt-6 shadow-lg z-10 relative">
                <h3 className="text-xl font-semibold mb-4 drop-shadow-sm text-gray-100">Detalle de Equipos Reportados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-700 pb-2">Fecha</th>
                        <th className="border-b border-gray-700 pb-2">Sala</th>
                        <th className="border-b border-gray-700 pb-2">Equipo</th>
                        <th className="border-b border-gray-700 pb-2">Categoría</th>
                        <th className="border-b border-gray-700 pb-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsData.map((t: any, index: number) => (
                        <tr key={index} className="border-b border-gray-800">
                          <td className="py-2">{new Date(t.created_at).toLocaleDateString()}</td>
                          <td className="py-2">{t.room?.name || t.roomId || 'N/A'}</td>
                          <td className="py-2">{t.equipment?.tag || t.tag || 'General'}</td>
                          <td className="py-2">{t.category}</td>
                          <td className="py-2">{t.status === 'PENDING' ? 'Pendiente' : t.status === 'IN_PROGRESS' ? 'En Revisión' : t.status === 'RESOLVED' ? 'Resuelto' : t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Subcomponente para las Tarjetas
const MetricCard = ({ title, value, Icon, color, isText = false }: { title: string, value: string | number, Icon: any, color: string, isText?: boolean }) => (
  <div className="bg-uts-dark-card/80 backdrop-blur-sm p-6 rounded-uts-card border border-gray-800/50 flex items-start justify-between shadow-lg">
    <div>
      <p className="text-sm text-gray-300 font-medium drop-shadow-sm">{title}</p>
      <p className={`${isText ? 'text-xl mt-2' : 'text-4xl mt-1'} font-bold text-gray-100 drop-shadow-sm`}>
        {value}
      </p>
    </div>
    <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-')}/20 ${color} backdrop-blur-sm border border-${color.replace('text-', '')}/30`}>
      <Icon size={28} />
    </div>
  </div>
);