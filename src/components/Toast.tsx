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
          bg: 'bg-green-900/90',
          border: 'border-green-500/50',
          icon: 'text-green-400',
          title: 'text-green-100',
          message: 'text-green-200'
        };
      case 'error':
        return {
          bg: 'bg-red-900/90',
          border: 'border-red-500/50',
          icon: 'text-red-400',
          title: 'text-red-100',
          message: 'text-red-200'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/90',
          border: 'border-yellow-500/50',
          icon: 'text-yellow-400',
          title: 'text-yellow-100',
          message: 'text-yellow-200'
        };
      case 'info':
        return {
          bg: 'bg-blue-900/90',
          border: 'border-blue-500/50',
          icon: 'text-blue-400',
          title: 'text-blue-100',
          message: 'text-blue-200'
        };
      default:
        return {
          bg: 'bg-gray-900/90',
          border: 'border-gray-500/50',
          icon: 'text-gray-400',
          title: 'text-gray-100',
          message: 'text-gray-200'
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
          ${styles.bg} ${styles.border} border backdrop-blur-md
          rounded-lg shadow-2xl p-4 flex items-start space-x-3
        `}
      >
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${styles.title} text-sm`}>
            {title}
          </h4>
          {message && (
            <p className={`mt-1 text-sm ${styles.message} leading-relaxed`}>
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;