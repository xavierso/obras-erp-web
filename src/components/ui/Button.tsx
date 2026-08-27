import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outlined' | 'text';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = true,
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-6 font-semibold rounded-xl transition-colors min-h-[52px] text-[15.5px] disabled:opacity-50 disabled:cursor-not-allowed';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  const variantStyles = {
    primary: 'bg-accent text-background hover:bg-accent/90',
    outlined: 'border border-white/25 text-foreground hover:bg-white/5',
    text: 'text-accent hover:bg-white/5 min-h-0'
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
