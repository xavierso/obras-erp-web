import React from 'react';
import { EventoCalendarioOut } from '@/lib/calendarioApi';
import { BadgeEvento } from './BadgeEvento';
import { useRouter } from 'next/navigation';

interface Props {
  mes: number;
  anio: number;
  eventos: EventoCalendarioOut[];
}

export const CalendarioVistaMes: React.FC<Props> = ({ mes, anio, eventos }) => {
  const router = useRouter();

  // Función para agrupar eventos por fecha
  const eventosPorDia = eventos.reduce((acc, evento) => {
    const dateKey = evento.fecha;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(evento);
    return acc;
  }, {} as Record<string, EventoCalendarioOut[]>);

  // Calcular días del mes
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const primerDiaSemana = new Date(anio, mes - 1, 1).getDay();
  // Ajustar para que lunes sea el primer día (getDay devuelve 0 para domingo)
  const offset = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);
  const diasVacios = Array.from({ length: offset }, (_, i) => i);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted mb-2">
        <div>LUN</div>
        <div>MAR</div>
        <div>MIÉ</div>
        <div>JUE</div>
        <div>VIE</div>
        <div>SÁB</div>
        <div>DOM</div>
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2 auto-rows-fr">
        {diasVacios.map(i => (
          <div key={`vacio-${i}`} className="min-h-[80px] md:min-h-[120px] bg-white/5 rounded-xl border border-white/5 opacity-30"></div>
        ))}
        
        {dias.map(dia => {
          const dateStr = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const eventosDia = eventosPorDia[dateStr] || [];
          const isHoy = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div 
              key={dia} 
              className={`min-h-[80px] md:min-h-[120px] bg-white/5 rounded-xl border p-1 md:p-2 flex flex-col hover:border-accent/50 transition-colors cursor-pointer overflow-hidden
                ${isHoy ? 'border-brand-blue/50 bg-brand-blue/10' : 'border-white/5'}
              `}
            >
              <div className={`text-right text-xs md:text-sm font-semibold mb-1 ${isHoy ? 'text-brand-blue' : 'text-text-muted'}`}>
                {dia}
              </div>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {eventosDia.map(ev => (
                  <BadgeEvento key={ev.id} evento={ev} compact={true} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
