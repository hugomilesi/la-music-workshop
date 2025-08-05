import { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'glass' | 'solid' | 'gradient';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  className,
  variant = 'glass',
  hover = true,
  padding = 'md',
  ...props
}: CardProps) {
  const baseClasses = 'rounded-xl border backdrop-blur-md transition-all duration-300';
  
  const variantClasses = {
    glass: 'glass border-white/20',
    solid: 'bg-white/10 border-white/20',
    gradient: 'bg-gradient-to-br from-white/20 to-white/5 border-white/20',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverClasses = hover ? 'hover:bg-white/15 hover:border-white/30 hover:shadow-lg hover:shadow-black/20' : '';

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}