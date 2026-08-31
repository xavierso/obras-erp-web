import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outlined' | 'text' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-6 font-semibold rounded-xl transition-all duration-200 min-h-[52px] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-navy to-brand-blue border border-white/10 text-white shadow-lg hover:shadow-brand-blue/40 hover:border-white/30 hover:brightness-110 active:scale-[0.98]',
    outlined: 'glass-panel text-text-main hover:bg-white/10 hover:border-white/30 hover:text-white active:scale-[0.98]',
    text: 'text-text-muted hover:text-text-main hover:bg-white/10 min-h-0 active:scale-[0.98]',
    danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/30 hover:text-white hover:border-error/50 active:scale-[0.98]'
  };

  return (
    <button 
      className={`${baseStyles} ${widthStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
