import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  padding = 'p-6' 
}) => {
  return (
    <div 
      className={`backdrop-blur-xl bg-surface/55 border border-white/10 rounded-2xl ${padding} ${className}`}
    >
      {children}
    </div>
  );
};
