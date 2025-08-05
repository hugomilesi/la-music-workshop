import { useState, useEffect } from 'react';

interface AuroraEffectProps {
  className?: string;
}

export default function AuroraEffect({ className = '' }: AuroraEffectProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [elementType, setElementType] = useState<string>('default');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Detectar o tipo de elemento sob o cursor
      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
      if (elementUnderCursor) {
        const tagName = elementUnderCursor.tagName.toLowerCase();
        const classList = elementUnderCursor.classList;
        
        // Determinar o tipo de elemento para reação da aurora
        if (tagName === 'button' || classList.contains('btn') || elementUnderCursor.closest('button')) {
          setElementType('button');
          setIsHovering(true);
        } else if (tagName === 'a' || elementUnderCursor.closest('a')) {
          setElementType('link');
          setIsHovering(true);
        } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
          setElementType('heading');
          setIsHovering(true);
        } else if (classList.contains('card') || elementUnderCursor.closest('.card')) {
          setElementType('card');
          setIsHovering(true);
        } else if (tagName === 'img') {
          setElementType('image');
          setIsHovering(true);
        } else {
          setElementType('default');
          setIsHovering(false);
        }
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setElementType('default');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Função para obter as cores da aurora baseada no tipo de elemento
  const getAuroraColors = () => {
    switch (elementType) {
      case 'button':
        return 'from-emerald-400/40 via-green-500/30 to-teal-400/40';
      case 'link':
        return 'from-blue-400/40 via-cyan-500/30 to-indigo-400/40';
      case 'heading':
        return 'from-purple-400/40 via-pink-500/30 to-violet-400/40';
      case 'card':
        return 'from-orange-400/40 via-amber-500/30 to-yellow-400/40';
      case 'image':
        return 'from-rose-400/40 via-red-500/30 to-pink-400/40';
      default:
        return 'from-purple-400/20 via-blue-500/15 to-cyan-400/20';
    }
  };

  // Função para obter o tamanho da aurora
  const getAuroraSize = () => {
    if (isHovering) {
      switch (elementType) {
        case 'button':
        case 'link':
          return 'w-32 h-32';
        case 'heading':
          return 'w-48 h-48';
        case 'card':
          return 'w-64 h-64';
        case 'image':
          return 'w-40 h-40';
        default:
          return 'w-24 h-24';
      }
    }
    return 'w-20 h-20';
  };

  // Função para obter a intensidade do blur
  const getBlurIntensity = () => {
    if (isHovering) {
      switch (elementType) {
        case 'button':
        case 'link':
          return 'blur-2xl';
        case 'heading':
          return 'blur-3xl';
        case 'card':
          return 'blur-3xl';
        default:
          return 'blur-xl';
      }
    }
    return 'blur-xl';
  };

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      {/* Aurora Principal */}
      <div
        className={`absolute rounded-full ${
          getAuroraSize()
        } bg-gradient-to-r ${getAuroraColors()} ${getBlurIntensity()} ${
          isHovering ? 'animate-pulse' : ''
        }`}
        style={{
          transform: `translate3d(${mousePosition.x - (isHovering ? 64 : 40)}px, ${mousePosition.y - (isHovering ? 64 : 40)}px, 0)`,
        }}
      />
      
      {/* Aurora Secundária (efeito de rastro) */}
      <div
        className={`absolute rounded-full ${
          isHovering ? 'w-16 h-16' : 'w-12 h-12'
        } bg-gradient-to-r ${getAuroraColors()} blur-lg opacity-60`}
        style={{
          transform: `translate3d(${mousePosition.x - (isHovering ? 32 : 24)}px, ${mousePosition.y - (isHovering ? 32 : 24)}px, 0)`,
        }}
      />
      
      {/* Efeito de brilho adicional quando hovering */}
      {isHovering && (
        <div
          className="absolute w-8 h-8 bg-white/20 rounded-full blur-md"
          style={{
            transform: `translate3d(${mousePosition.x - 16}px, ${mousePosition.y - 16}px, 0)`,
          }}
        />
      )}
    </div>
  );
}