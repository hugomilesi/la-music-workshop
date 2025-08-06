import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  duration = 4000 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Aguarda a animação terminar
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`
          bg-gradient-to-r from-green-500 to-emerald-600 
          text-white px-6 py-4 rounded-lg shadow-lg 
          flex items-center gap-3 min-w-[300px] max-w-[400px]
          transform transition-all duration-300 ease-in-out
          ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        <CheckCircle className="w-6 h-6 flex-shrink-0" />
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={() => {
            setShow(false);
            setTimeout(onClose, 300);
          }}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SuccessMessage;