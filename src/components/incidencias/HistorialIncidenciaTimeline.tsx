import React from 'react';
import { HistorialIncidencia, EstadoIncidencia } from '@/lib/incidenciasApi';

interface HistorialIncidenciaTimelineProps {
  historial: HistorialIncidencia[];
}

export function HistorialIncidenciaTimeline({ historial }: HistorialIncidenciaTimelineProps) {
  if (!historial || historial.length === 0) return null;

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {historial.map((item, index) => (
        <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-surface bg-bg-deep shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
          </div>
          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white/5 border border-white/5 p-3 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
              <span className="text-sm font-semibold text-text-main">
                {item.usuario?.nombre || 'Usuario Desconocido'}
              </span>
              <time className="text-[10px] text-text-muted">
                {new Date(item.fecha).toLocaleString()}
              </time>
            </div>
            <p className="text-xs text-text-muted">
              {item.estado_anterior ? (
                <>Cambió de <span className="font-mono text-[10px] bg-black/20 px-1 py-0.5 rounded">{item.estado_anterior}</span> a <span className="font-mono text-[10px] bg-black/20 px-1 py-0.5 rounded text-accent">{item.estado_nuevo}</span></>
              ) : (
                <>Creó la incidencia como <span className="font-mono text-[10px] bg-black/20 px-1 py-0.5 rounded text-brand-blue">{item.estado_nuevo}</span></>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
