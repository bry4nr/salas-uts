import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
  onRedirectLogin: () => void;
}

export default function ProtectedRoute({ children, allowedRoles, onRedirectLogin }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Evitamos el bucle infinito ejecutando la redirección como un efecto secundario
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      onRedirectLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user]);

  // Mientras verifica el token en el backend
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-uts-dark-bg"><Loader2 className="animate-spin text-uts-green" size={40} /></div>;
  }

  // Si no hay sesión iniciada
  if (!isAuthenticated || !user) {
    return null;
  }

  // Si el usuario tiene un rol que no está en la lista de permitidos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-uts-dark-bg">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-error-red/10 border border-error-red/30 p-8 rounded-2xl max-w-md w-full shadow-uts-glow">
          <AlertTriangle size={56} className="text-error-red mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-8">Tu rol de {user.role.toLowerCase()} no tiene permisos para ver esta área.</p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full shadow-lg bg-gray-800 hover:bg-gray-700">
            <ArrowLeft size={20} /> Volver Atrás
          </button>
        </motion.div>
      </div>
    );
  }

  // Si todo es correcto, mostramos la pantalla protegida
  return <>{children}</>;
}