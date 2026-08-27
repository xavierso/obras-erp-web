import React from 'react';
import { EventoCalendarioOut } from '@/lib/calendarioApi';
import { BadgeEvento } from './BadgeEvento';

export const CalendarioAgenda: React.FC<{ eventos: EventoCalendarioOut[] }> = ({ eventos }) => {
  if (eventos.length === 0) {
    return <div className="text-center text-text-muted py-8 text-sm">No hay próximos eventos.</div>;
  }

  // Agrupar por fecha
  const eventosPorDia = eventos.reduce((acc, evento) => {
    const dateKey = evento.fecha;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(evento);
    return acc;
  }, {} as Record<string, EventoCalendarioOut[]>);

  const fechas = Object.keys(eventosPorDia).sort();

  return (
    <div className="space-y-6">
      {fechas.map(fecha => {
        const dateObj = new Date(fecha);
        const hoy = new Date().toISOString().split('T')[0];
        let labelFecha = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        
        if (fecha === hoy) labelFecha = 'Hoy, ' + labelFecha;

        return (
          <div key={fecha} className="space-y-3">
            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider sticky top-0 bg-background py-1 z-10">
              {labelFecha}
            </h4>
            <div className="space-y-2">
              {eventosPorDia[fecha].map(ev => (
                <div key={ev.id} className="flex gap-3 bg-white/5 border border-white/5 p-3 rounded-xl hover:border-accent/30 transition-colors">
                  <div className="w-12 shrink-0 text-center flex flex-col justify-center border-r border-white/10 pr-2">
                    <span className="text-xs font-bold text-text-main">
                      {ev.hora_inicio ? ev.hora_inicio.slice(0, 5) : 'Todo el día'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <BadgeEvento evento={ev} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
