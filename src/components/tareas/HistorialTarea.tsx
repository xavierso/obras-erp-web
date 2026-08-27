import React from 'react';
import { HistorialTarea, EstadoTarea } from '@/lib/tareasApi';

const estadoLabels = {
  [EstadoTarea.PENDIENTE]: 'Pendiente',
  [EstadoTarea.EN_PROGRESO]: 'En Progreso',
  [EstadoTarea.COMPLETADA]: 'Completada',
};

const estadoColors = {
  [EstadoTarea.PENDIENTE]: 'text-text-muted',
  [EstadoTarea.EN_PROGRESO]: 'text-brand-blue',
  [EstadoTarea.COMPLETADA]: 'text-success',
};

interface HistorialTareaProps {
  historial: HistorialTarea[];
}

export function HistorialTareaTimeline({ historial }: HistorialTareaProps) {
  if (!historial || historial.length === 0) return null;

  // Ordenar el historial del más nuevo al más antiguo
  const sortedHistorial = [...historial].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-text-main mb-2">Historial de cambios</h4>
      <div className="relative border-l border-white/10 ml-2 space-y-4">
        {sortedHistorial.map((item, idx) => (
          <div key={item.id} className="pl-4 relative">
            <div className="absolute w-2 h-2 bg-white/20 rounded-full -left-1.5 top-1.5 border border-bg-deep"></div>
            <p className="text-xs text-text-muted mb-0.5">
              {new Date(item.fecha).toLocaleString()}
            </p>
            <p className="text-sm text-text-main">
              <span className="font-semibold">{item.usuario.nombre}</span>{' '}
              {item.estado_anterior ? (
                <>
                  cambió el estado a <span className={`font-semibold ${estadoColors[item.estado_nuevo]}`}>{estadoLabels[item.estado_nuevo]}</span>
                </>
              ) : (
                <>
                  creó la tarea como <span className={`font-semibold ${estadoColors[item.estado_nuevo]}`}>{estadoLabels[item.estado_nuevo]}</span>
                </>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
