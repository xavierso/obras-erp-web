import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  interactive?: boolean;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  interactive = false,
  style
}) => {
  return (
    <div 
      className={`glass-panel rounded-2xl ${interactive ? 'glass-panel-interactive transition-all duration-200' : ''} ${padding} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
