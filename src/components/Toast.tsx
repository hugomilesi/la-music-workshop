import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id]); // Adicionar id como dependência para evitar problemas

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-800/95 via-green-900/95 to-emerald-900/95',
          border: 'border-green-400/60',
          icon: 'text-green-300',
          title: 'text-white font-bold drop-shadow-lg',
          message: 'text-green-50 font-medium',
          glow: 'shadow-lg shadow-green-500/25'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-br from-red-800/95 via-red-900/95 to-rose-900/95',
          border: 'border-red-400/60',
          icon: 'text-red-300',
          title: 'text-white font-bold drop-shadow-lg',
          message: 'text-red-50 font-medium',
          glow: 'shadow-lg shadow-red-500/25'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-amber-800/95 via-yellow-900/95 to-orange-900/95',
          border: 'border-amber-400/60',
          icon: 'text-amber-300',
          title: 'text-white font-bold drop-shadow-lg',
          message: 'text-amber-50 font-medium',
          glow: 'shadow-lg shadow-amber-500/25'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-br from-blue-800/95 via-blue-900/95 to-indigo-900/95',
          border: 'border-blue-400/60',
          icon: 'text-blue-300',
          title: 'text-white font-bold drop-shadow-lg',
          message: 'text-blue-50 font-medium',
          glow: 'shadow-lg shadow-blue-500/25'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-800/95 via-gray-900/95 to-slate-900/95',
          border: 'border-slate-400/60',
          icon: 'text-slate-300',
          title: 'text-white font-bold drop-shadow-lg',
          message: 'text-slate-50 font-medium',
          glow: 'shadow-lg shadow-slate-500/25'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          ${styles.bg} ${styles.border} ${styles.glow}
          border-2 backdrop-blur-xl rounded-2xl p-5 flex items-start space-x-4
          transform hover:scale-[1.02] transition-all duration-300
          shadow-2xl relative overflow-hidden
        `}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl" />
        
        <div className={`flex-shrink-0 ${styles.icon} relative z-10 p-2 rounded-xl bg-white/10`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0 relative z-10">
          <h4 className={`${styles.title} text-base tracking-wide`}>
            {title}
          </h4>
          {message && (
            <p className={`mt-2 text-sm ${styles.message} leading-relaxed opacity-95`}>
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 relative z-10 p-2 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;