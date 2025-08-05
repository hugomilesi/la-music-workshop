import { ReactNode, HTMLAttributes, useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface ReactiveGlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glowIntensity?: number;
}

export default function ReactiveGlowCard({
  children,
  className,
  padding = 'md',
  glowIntensity = 1,
  ...props
}: ReactiveGlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [borderIntensity, setBorderIntensity] = useState(0);

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x, y });

      // Calcular proximidade das bordas para intensidade reativa
      const distanceToLeft = x;
      const distanceToRight = rect.width - x;
      const distanceToTop = y;
      const distanceToBottom = rect.height - y;
      
      const minDistance = Math.min(
        distanceToLeft,
        distanceToRight,
        distanceToTop,
        distanceToBottom
      );
      
      // Normalizar proximidade (0 = na borda, 1 = no centro)
      // Quanto mais perto da borda, maior a intensidade
      const maxDistance = 50; // Distância máxima para ativar o efeito
      const proximity = Math.max(0, 1 - (minDistance / maxDistance));
      setBorderIntensity(proximity);
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      setBorderIntensity(0);
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // Calcular ângulo baseado na posição do mouse para o gradiente cônico
  const centerX = cardRef.current ? cardRef.current.offsetWidth / 2 : 0;
  const centerY = cardRef.current ? cardRef.current.offsetHeight / 2 : 0;
  const angle = Math.atan2(mousePosition.y - centerY, mousePosition.x - centerX) * (180 / Math.PI);

  // Opacidade e intensidade baseadas na proximidade da borda
  const effectOpacity = isHovered ? borderIntensity * glowIntensity : 0;
  const glowRadius = 20 + borderIntensity * 40;

  // Gradiente cônico que cria o "anel colorido escondido"
  const borderGradient = `conic-gradient(from ${angle}deg at ${mousePosition.x}px ${mousePosition.y}px,
    rgba(255, 20, 147, ${effectOpacity}) 0deg,
    rgba(138, 43, 226, ${effectOpacity * 0.8}) 60deg,
    rgba(30, 144, 255, ${effectOpacity * 0.6}) 120deg,
    rgba(0, 255, 255, ${effectOpacity * 0.8}) 180deg,
    rgba(255, 20, 147, ${effectOpacity}) 240deg,
    rgba(138, 43, 226, ${effectOpacity * 0.8}) 300deg,
    rgba(255, 20, 147, ${effectOpacity}) 360deg
  )`;

  // Brilho externo que segue o mouse
  const externalGlow = isHovered && borderIntensity > 0 ? {
    filter: `drop-shadow(0 0 ${glowRadius}px rgba(255, 20, 147, ${effectOpacity * 0.6})) drop-shadow(0 0 ${glowRadius * 1.5}px rgba(138, 43, 226, ${effectOpacity * 0.4})) drop-shadow(0 0 ${glowRadius * 2}px rgba(30, 144, 255, ${effectOpacity * 0.3}))`
  } : {};

  return (
    <div
      ref={cardRef}
      className={clsx(
        'relative rounded-xl backdrop-blur-md transition-all duration-300 overflow-hidden',
        paddingClasses[padding],
        className
      )}
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 100%
          )
        `,
        border: `2px solid transparent`,
        backgroundImage: borderGradient,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        ...externalGlow
      }}
      {...props}
    >
      {/* Máscara para revelar apenas uma pequena parte do gradiente */}
      {isHovered && borderIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle ${glowRadius}px at ${mousePosition.x}px ${mousePosition.y}px,
              transparent 0%,
              transparent 40%,
              rgba(0, 0, 0, ${1 - effectOpacity}) 60%,
              rgba(0, 0, 0, 0.9) 100%
            )`,
            mixBlendMode: 'multiply'
          }}
        />
      )}
      
      {/* Conteúdo do card */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}