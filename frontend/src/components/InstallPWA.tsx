import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-uts-dark-card border border-uts-green shadow-uts-glow px-4 py-3 rounded-full flex items-center gap-4 w-max"
      >
        <div className="flex flex-col text-left">
          <span className="text-sm font-bold text-gray-100">App Salas UTS</span>
          <span className="text-xs text-gray-400">Instálala para acceso rápido</span>
        </div>
        <button
          onClick={handleInstallClick}
          className="bg-uts-green text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <Download size={16} /> Instalar
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-gray-400 hover:text-white transition-colors ml-1 p-1"
          aria-label="Cerrar banner"
        >
          <X size={20} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}