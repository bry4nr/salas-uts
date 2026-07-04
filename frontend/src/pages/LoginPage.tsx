import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import bgLogin from '../assets/bg-login.png';
import logoUts from '../assets/logo-uts.png';
import logoRedes from '../assets/logo_redes.jpeg';

interface Props {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally { setIsLoading(false); }
  };
const handleGuestLogin = async () => {
  setIsLoading(true);
  setError('');
  try {
    const res = await api.post('/auth/login', { email: 'invitado_alpha@uts.edu.co', password: '' });
    login(res.data.token, res.data.user);
    onLoginSuccess();
  } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión como invitado');
    } finally { setIsLoading(false); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      
      {/* Etiqueta de fecha actual dinámica */}
      <div className="absolute top-4 w-full flex justify-center z-20">
        <div className="text-gray-200 text-sm md:text-base font-medium bg-uts-dark-bg/60 px-4 py-2 rounded-full backdrop-blur-md border border-gray-700/50 shadow-sm capitalize">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="card-uts p-8 md:p-10 max-w-md w-full relative z-10 bg-uts-dark-bg/90 backdrop-blur-md border border-gray-700/50 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img src={logoUts} alt="Logo UTS" className="h-24 object-contain drop-shadow-md" />
            <img src={logoRedes} alt="Logo Redes" className="h-24 rounded-lg object-contain drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold text-uts-gold mb-2 drop-shadow-sm">Salas UTS</h1>
          <p className="text-gray-300">Sistema de Gestión de Incidencias</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Usuario o Correo Institucional" 
              className="w-full bg-uts-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all"
            />
          </div>
          <div className="relative">
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña" 
              className="w-full bg-uts-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-uts-green focus:ring-1 focus:ring-uts-green transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-error-red/10 border border-error-red/30 text-error-red text-sm font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="pt-4 border-t border-gray-800 space-y-3">
            <button 
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />} Iniciar Sesión
            </button>
            <button 
              type="button"
              disabled={isLoading}
              onClick={handleGuestLogin}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-lg px-4 py-3 font-medium transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              Ingreso Estudiantes/Docentes (Prueba Alpha)
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}