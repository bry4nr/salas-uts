import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { RoomData } from './types/room'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RoomPage from './pages/RoomPage'
import SupportDashboard from './pages/SupportDashboard'
import TeacherTicketsPage from './pages/TeacherTicketsPage'
import StatsDashboard from './pages/StatsDashboard'
import { roomsDatabase } from './data/rooms'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import InstallPWA from './components/InstallPWA'

type PageState = 'login' | 'dashboard' | 'room' | 'teacher-tickets' | 'stats' | 'rooms-dashboard';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageState>('login');
  const [selectedRoomData, setSelectedRoomData] = useState<RoomData | null>(null);
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  // Lógica de Enrutamiento Raíz: Si entra y está logueado, redirigir al dashboard.
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('login');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Controladores de navegación
  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
  };

  const handleSelectRoom = (roomName: string) => {
    const roomData = roomsDatabase[roomName];
    if (roomData) {
      setSelectedRoomData(roomData);
    }
    setCurrentPage('room');
  };

  // Extraemos la lógica de rutas para garantizar que solo se renderice UNA pantalla a la vez
  const renderPage = () => {
    if (currentPage === 'login') return <LoginPage key="login" onLoginSuccess={handleLoginSuccess} />;
    
    if (currentPage === 'dashboard' && user?.role === 'DOCENTE') return (
      <ProtectedRoute key="dashboard-docente" allowedRoles={['DOCENTE', 'ADMIN']} onRedirectLogin={() => setCurrentPage('login')}>
        <DashboardPage userRole="docente" onLogout={handleLogout} onSelectRoom={handleSelectRoom} onViewTickets={() => setCurrentPage('teacher-tickets')} />
      </ProtectedRoute>
    );

    if (currentPage === 'teacher-tickets' && user?.role === 'DOCENTE') return (
      <ProtectedRoute key="teacher-tickets" allowedRoles={['DOCENTE']} onRedirectLogin={() => setCurrentPage('login')}>
        <TeacherTicketsPage onBack={() => setCurrentPage('dashboard')} />
      </ProtectedRoute>
    );

    if (currentPage === 'dashboard' && user?.role === 'SOPORTE') return (
      <ProtectedRoute key="dashboard-soporte" allowedRoles={['SOPORTE', 'ADMIN']} onRedirectLogin={() => setCurrentPage('login')}>
        <SupportDashboard userRole="soporte" onLogout={handleLogout} onViewStats={() => setCurrentPage('stats')} onViewRooms={() => setCurrentPage('rooms-dashboard')} />
      </ProtectedRoute>
    );

    if (currentPage === 'rooms-dashboard' && user?.role === 'SOPORTE') return (
      <ProtectedRoute key="rooms-dashboard-soporte" allowedRoles={['SOPORTE', 'ADMIN']} onRedirectLogin={() => setCurrentPage('login')}>
        <DashboardPage userRole="soporte" onLogout={handleLogout} onSelectRoom={handleSelectRoom} onViewTickets={() => setCurrentPage('dashboard')} />
      </ProtectedRoute>
    );

    if (currentPage === 'stats' && (user?.role === 'SOPORTE' || user?.role === 'ADMIN')) return (
      <ProtectedRoute key="stats" allowedRoles={['SOPORTE', 'ADMIN']} onRedirectLogin={() => setCurrentPage('login')}>
        <StatsDashboard onBack={() => setCurrentPage('dashboard')} />
      </ProtectedRoute>
    );

    if (currentPage === 'room' && selectedRoomData) return (
      <ProtectedRoute key="room" onRedirectLogin={() => setCurrentPage('login')}>
        <RoomPage roomData={selectedRoomData} onBack={() => setCurrentPage(user?.role === 'SOPORTE' ? 'rooms-dashboard' : 'dashboard')} />
      </ProtectedRoute>
    );

    return null;
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {renderPage()}
      </AnimatePresence>
      {/* El botón de PWA ahora vive fuera de las animaciones de página */}
      <InstallPWA />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
