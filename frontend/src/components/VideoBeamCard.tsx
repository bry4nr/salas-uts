import { motion } from 'framer-motion';
import { Projector, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import type { Device, DeviceStatus } from '../types/room';

interface Props {
  device: Device;
  onClick?: () => void;
}

const statusConfig: Record<DeviceStatus, { bg: string; text: string; border: string; Icon: any }> = {
  ok: {
    bg: 'bg-ok-green/10',
    text: 'text-ok-green',
    border: 'border-ok-green/30',
    Icon: CheckCircle2,
  },
  warning: {
    bg: 'bg-warning-orange/10',
    text: 'text-warning-orange',
    border: 'border-warning-orange/30',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-error-red/10',
    text: 'text-error-red',
    border: 'border-error-red/30',
    Icon: AlertCircle,
  },
};

export default function VideoBeamCard({ device, onClick }: Props) {
  const config = statusConfig[device.status];
  const { Icon } = config;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: -20 },
        show: { opacity: 1, y: 0 }
      }}
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-uts-card shadow-uts-shadow border backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 ${config.bg} ${config.border}`}
    >
      <div className={`p-3 rounded-full bg-uts-dark-bg/50 ${config.text}`}>
        <Projector size={28} />
      </div>
      <div>
        <h3 className="font-bold text-gray-100">Video Beam Principal</h3>
        <p className={`text-sm flex items-center gap-1 mt-1 font-medium ${config.text}`}>
          <Icon size={16} />
          {device.status === 'ok' ? 'Operativo' : device.status === 'warning' ? 'En revisión' : 'Falla reportada'}
        </p>
      </div>
    </motion.div>
  );
}