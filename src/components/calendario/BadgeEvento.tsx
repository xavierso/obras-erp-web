import React from 'react';
import { EventoCalendarioOut } from '@/lib/calendarioApi';

export const BadgeEvento: React.FC<{ evento: EventoCalendarioOut, compact?: boolean }> = ({ evento, compact = false }) => {
  const colorMap: Record<string, string> = {
    visita: 'bg-brand-blue text-white',
    tarea: 'bg-yellow-500 text-black',
    incidencia: 'bg-error text-white',
    hito: 'bg-purple-500 text-white',
    reunion: 'bg-gray-200 text-gray-800',
    entrega: 'bg-green-500 text-white',
    otro: 'bg-white/20 text-white'
  };

  const dotMap: Record<string, string> = {
    visita: 'bg-brand-blue',
    tarea: 'bg-yellow-500',
    incidencia: 'bg-error',
    hito: 'bg-purple-500',
    reunion: 'bg-gray-400',
    entrega: 'bg-green-500',
    otro: 'bg-white/40'
  };

  const baseColor = colorMap[evento.tipo] || colorMap['otro'];
  const dotColor = dotMap[evento.tipo] || dotMap['otro'];

  if (compact) {
    return (
      <div className="flex items-center text-xs truncate w-full group" title={evento.titulo}>
        <span className={`w-2 h-2 rounded-full mr-1.5 shrink-0 ${dotColor}`}></span>
        <span className="truncate text-text-main group-hover:text-accent transition-colors">
          {evento.hora_inicio ? `${evento.hora_inicio.slice(0,5)} ` : ''}{evento.titulo}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-2 rounded-lg text-xs font-medium border border-white/10 ${baseColor} flex flex-col`}>
      <span className="font-bold truncate">{evento.titulo}</span>
      {evento.obra_nombre && <span className="opacity-80 truncate text-[10px] mt-0.5">{evento.obra_nombre}</span>}
      {evento.hora_inicio && <span className="opacity-80 text-[10px] mt-1">{evento.hora_inicio.slice(0, 5)}</span>}
    </div>
  );
};
