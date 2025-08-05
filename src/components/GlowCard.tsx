import { ReactNode, HTMLAttributes, useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glowIntensity?: number;
}

export default function GlowCard({
  children,
  className,
  padding = 'md',
  glowIntensity = 0.8,
  ...props
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [edgeProximity, setEdgeProximity] = useState(0);

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

      // Calcular proximidade das bordas
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
      const maxDistance = Math.min(rect.width, rect.height) / 2;
      const proximity = Math.max(0, 1 - (minDistance / maxDistance));
      setEdgeProximity(proximity);
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      setEdgeProximity(0);
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

  // Calcular ângulo do gradiente cônico baseado na posição do mouse
  const angle = mousePosition.x !== 0 || mousePosition.y !== 0 
    ? Math.atan2(mousePosition.y - 150, mousePosition.x - 150) * (180 / Math.PI)
    : 0;

  // Opacidade do brilho baseada na proximidade da borda
  const glowOpacity = isHovered ? edgeProximity * glowIntensity : 0;

  const backgroundStyle = `
    radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, 
      rgba(147, 51, 234, ${glowOpacity * 0.3}) 0%, 
      rgba(59, 130, 246, ${glowOpacity * 0.2}) 25%, 
      rgba(16, 185, 129, ${glowOpacity * 0.1}) 50%, 
      transparent 70%
    ),
    conic-gradient(from ${angle}deg at ${mousePosition.x}px ${mousePosition.y}px,
      rgba(147, 51, 234, ${glowOpacity * 0.4}) 0deg,
      rgba(59, 130, 246, ${glowOpacity * 0.3}) 90deg,
      rgba(16, 185, 129, ${glowOpacity * 0.2}) 180deg,
      rgba(236, 72, 153, ${glowOpacity * 0.3}) 270deg,
      rgba(147, 51, 234, ${glowOpacity * 0.4}) 360deg
    ),
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      rgba(255, 255, 255, 0.05) 100%
    )
  `;

  const meshGradientStyle = 'radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)';

  return (
    <div
      ref={cardRef}
      className={clsx(
        'relative rounded-xl backdrop-blur-md transition-all duration-300 overflow-hidden',
        paddingClasses[padding],
        className
      )}
      style={{
        background: backgroundStyle,
        border: `1px solid rgba(255, 255, 255, ${0.2 + glowOpacity * 0.3})`,
        boxShadow: isHovered 
          ? `0 0 ${20 + edgeProximity * 30}px rgba(147, 51, 234, ${glowOpacity * 0.5}),
             0 0 ${40 + edgeProximity * 60}px rgba(59, 130, 246, ${glowOpacity * 0.3}),
             inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      {...props}
    >
      {/* Mesh gradient overlay para efeito adicional */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none rounded-xl"
        style={{
          background: meshGradientStyle,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Conteúdo do card */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}