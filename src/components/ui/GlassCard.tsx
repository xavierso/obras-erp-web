import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  style
}) => {
  return (
    <div 
      className={`backdrop-blur-xl bg-surface/55 border border-white/10 rounded-2xl ${padding} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
