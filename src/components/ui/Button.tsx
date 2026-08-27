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
    primary: 'bg-gradient-to-r from-brand-navy to-brand-blue border border-white/10 text-white shadow-lg hover:shadow-brand-blue/20 hover:border-white/20',
    outlined: 'glass-panel text-text-main hover:glass-panel-interactive',
    text: 'text-text-muted hover:text-text-main hover:bg-white/5 min-h-0',
    danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/20'
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
