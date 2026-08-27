import React, { useState } from 'react';
import { Incidencia, EstadoIncidencia, incidenciasApi } from '@/lib/incidenciasApi';
import { Button } from '@/components/ui/Button';
import { HistorialIncidenciaTimeline } from './HistorialIncidenciaTimeline';
import { FormIncidenciaInline } from './FormIncidenciaInline';

const estadoLabels = {
  [EstadoIncidencia.NUEVA]: 'Nueva',
  [EstadoIncidencia.EN_PROCESO]: 'En Proceso',
  [EstadoIncidencia.RESUELTA]: 'Resuelta',
  [EstadoIncidencia.CERRADA]: 'Cerrada',
};

const estadoColors = {
  [EstadoIncidencia.NUEVA]: 'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
  [EstadoIncidencia.EN_PROCESO]: 'bg-warning/20 text-warning border-warning/30',
  [EstadoIncidencia.RESUELTA]: 'bg-success/20 text-success border-success/30',
  [EstadoIncidencia.CERRADA]: 'bg-white/10 text-text-muted border-white/20',
};

interface ListaIncidenciasProps {
  obraId: number;
  visitaId?: number;
  incidencias: Incidencia[];
  onRefresh: () => void;
  hideAddButton?: boolean;
}

export function ListaIncidencias({ obraId, visitaId, incidencias, onRefresh, hideAddButton = false }: ListaIncidenciasProps) {
  const [incidenciaEditando, setIncidenciaEditando] = useState<number | null>(null);
  const [mostrandoNueva, setMostrandoNueva] = useState(false);
  const [incidenciasExpandidas, setIncidenciasExpandidas] = useState<number[]>([]);

  const toggleExpandir = (id: number) => {
    setIncidenciasExpandidas(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSaved = () => {
    setIncidenciaEditando(null);
    setMostrandoNueva(false);
    onRefresh();
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta incidencia?')) {
      try {
        await incidenciasApi.eliminar(id);
        onRefresh();
      } catch (error) {
        console.error('Error eliminando incidencia', error);
        alert('Hubo un error al eliminar la incidencia.');
      }
    }
  };

  return (
    <div>
      {!hideAddButton && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-text-main">Incidencias</h3>
          {!mostrandoNueva && (
            <Button variant="primary" fullWidth={false} onClick={() => setMostrandoNueva(true)} className="!min-h-[32px] px-3 py-1.5 text-xs">
              + Nueva Incidencia
            </Button>
          )}
        </div>
      )}

      {mostrandoNueva && (
        <div className="mb-4">
          <FormIncidenciaInline 
            obraId={obraId}
            visitaId={visitaId}
            onClose={() => setMostrandoNueva(false)}
            onSaved={handleSaved}
          />
        </div>
      )}

      {incidencias.length === 0 ? (
        <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10">
          <p className="text-text-muted text-sm">No hay incidencias registradas.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {incidencias.map(incidencia => {
            const isExpanded = incidenciasExpandidas.includes(incidencia.id);
            const isEditing = incidenciaEditando === incidencia.id;

            if (isEditing) {
              return (
                <FormIncidenciaInline 
                  key={incidencia.id}
                  obraId={obraId}
                  visitaId={incidencia.visita_id}
                  incidenciaSeleccionada={incidencia}
                  onClose={() => setIncidenciaEditando(null)}
                  onSaved={handleSaved}
                />
              );
            }

            return (
              <div key={incidencia.id} className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-sm hover:border-white/10 transition-colors">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpandir(incidencia.id)}
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className={`shrink-0 w-2 h-2 rounded-full ${incidencia.estado === EstadoIncidencia.RESUELTA ? 'bg-success' : incidencia.estado === EstadoIncidencia.CERRADA ? 'bg-text-muted' : incidencia.estado === EstadoIncidencia.EN_PROCESO ? 'bg-warning' : 'bg-brand-blue'}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono bg-white/10 text-text-muted px-2 py-0.5 rounded">{incidencia.codigo}</span>
                        <p className="text-sm font-semibold text-text-main truncate">{incidencia.titulo}</p>
                      </div>
                      <div className="flex items-center text-xs text-text-muted mt-1 space-x-4">
                        <span className="flex items-center">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          {incidencia.responsable?.nombre || 'Sin asignar'}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Det: {new Date(incidencia.fecha_deteccion).toLocaleDateString()}
                        </span>
                        {incidencia.fecha_resolucion && (
                          <span className="flex items-center text-success">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Res: {new Date(incidencia.fecha_resolucion).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center space-x-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${estadoColors[incidencia.estado]}`}>
                        {estadoLabels[incidencia.estado]}
                      </span>
                      <svg className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-white/5 bg-black/10">
                    <div className="flex justify-end space-x-2 mt-3 mb-2">
                      <Button variant="outlined" onClick={() => setIncidenciaEditando(incidencia.id)} className="!py-1 !px-2 text-[10px]">Editar</Button>
                      <Button variant="text" onClick={() => handleEliminar(incidencia.id)} className="!py-1 !px-2 text-[10px] text-error hover:text-red-400">Eliminar</Button>
                    </div>

                    <div className="space-y-4">
                      {incidencia.descripcion && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted mb-1">Descripción</p>
                          <p className="text-sm text-text-main">{incidencia.descripcion}</p>
                        </div>
                      )}

                      {incidencia.observaciones && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted mb-1">Observaciones</p>
                          <p className="text-sm text-text-main bg-white/5 p-2 rounded">{incidencia.observaciones}</p>
                        </div>
                      )}
                      
                      {incidencia.archivos && incidencia.archivos.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted mb-2">Archivos Adjuntos ({incidencia.archivos.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {incidencia.archivos.map(archivo => (
                              <a 
                                key={archivo.id} 
                                href={archivo.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 transition-colors group"
                              >
                                {archivo.tipo === 'foto' ? (
                                  <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                ) : archivo.tipo === 'video' ? (
                                  <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                ) : (
                                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                )}
                                <span className="text-xs font-medium text-text-main group-hover:text-brand-blue transition-colors max-w-[150px] truncate">
                                  {archivo.nombre_original}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {incidencia.tareas && incidencia.tareas.length > 0 && (
                        <div className="bg-brand-blue/5 border border-brand-blue/10 p-3 rounded-lg">
                          <p className="text-xs font-semibold text-brand-blue mb-2">Tareas Relacionadas</p>
                          <ul className="space-y-1">
                            {incidencia.tareas.map(t => (
                              <li key={t.id} className="text-xs flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${t.estado === 'PENDIENTE' ? 'bg-brand-blue' : t.estado === 'VENCIDA' ? 'bg-error' : t.estado === 'EN_PROCESO' ? 'bg-warning' : 'bg-success'}`}></span>
                                <span className="text-text-main truncate max-w-[200px] sm:max-w-xs">{t.titulo}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="bg-black/20 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-text-muted mb-3">Historial de Cambios</p>
                        <HistorialIncidenciaTimeline historial={incidencia.historial} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
