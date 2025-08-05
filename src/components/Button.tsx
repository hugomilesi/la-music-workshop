import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-primary text-white hover:shadow-lg hover:shadow-purple-500/25 focus:ring-purple-500 glow-purple',
    secondary: 'bg-gradient-secondary text-white hover:shadow-lg hover:shadow-pink-500/25 focus:ring-pink-500 glow-pink',
    glass: 'glass text-white font-semibold hover:bg-white/20 focus:ring-white/50 border border-white/30 shadow-lg',
    outline: 'border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 focus:ring-white/50'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  };
  
  const buttonClasses = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: clsx(buttonClasses, (children as React.ReactElement<any>).props.className),
      disabled: disabled || loading,
      ...props
    });
  }
  
  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}