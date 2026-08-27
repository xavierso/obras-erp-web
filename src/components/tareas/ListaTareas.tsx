import React, { useState } from 'react';
import { Tarea, EstadoTarea } from '@/lib/tareasApi';
import { Button } from '@/components/ui/Button';
import { isUserLector } from '@/lib/authApi';
import { useAuth } from '@/context/AuthContext';
import { FormTareaInline } from './FormTareaInline';
import { HistorialTareaTimeline } from './HistorialTarea';

const estadoLabels = {
  [EstadoTarea.PENDIENTE]: 'Pendiente',
  [EstadoTarea.EN_PROGRESO]: 'En Progreso',
  [EstadoTarea.COMPLETADA]: 'Completada',
  [EstadoTarea.VENCIDA]: 'Vencida',
};

const estadoColors = {
  [EstadoTarea.PENDIENTE]: 'bg-white/10 text-text-main',
  [EstadoTarea.EN_PROGRESO]: 'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
  [EstadoTarea.COMPLETADA]: 'bg-success/20 text-success border-success/30',
  [EstadoTarea.VENCIDA]: 'bg-error/20 text-error border-error/30',
};

interface ListaTareasProps {
  obraId: number;
  visitaId?: number;
  tareas: Tarea[];
  onRefresh: () => void;
}

export function ListaTareas({ obraId, visitaId, tareas, onRefresh }: ListaTareasProps) {
  const { user } = useAuth();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingTareaId, setEditingTareaId] = useState<number | null>(null);
  const [tareaExpandida, setTareaExpandida] = useState<number | null>(null);

  const handleOpenNew = () => {
    setEditingTareaId(null);
    setShowNewForm(true);
  };

  const handleEditSaved = () => {
    setEditingTareaId(null);
    onRefresh();
  };

  const handleNewSaved = () => {
    setShowNewForm(false);
    onRefresh();
  };

  const toggleExpand = (id: number) => {
    setTareaExpandida(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-main">
          Tareas y Pendientes ({tareas.length})
        </h3>
        {!isUserLector(user) && !showNewForm && (
          <Button onClick={handleOpenNew} fullWidth={false} className="!min-h-[32px] px-3 py-1.5 text-xs">
            + Nueva Tarea
          </Button>
        )}
      </div>

      {showNewForm && (
        <div className="mb-4">
          <FormTareaInline
            obraId={obraId}
            visitaId={visitaId}
            onClose={() => setShowNewForm(false)}
            onSaved={handleNewSaved}
          />
        </div>
      )}

      {tareas.length === 0 && !showNewForm ? (
        <div className="text-center py-6 text-text-muted text-sm border border-dashed border-white/10 rounded-xl">
          No hay tareas registradas.
        </div>
      ) : (
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {tareas.map(tarea => (
            <div key={tarea.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
              {editingTareaId === tarea.id ? (
                <div className="p-4">
                  <FormTareaInline
                    obraId={obraId}
                    visitaId={visitaId}
                    tareaSeleccionada={tarea}
                    onClose={() => setEditingTareaId(null)}
                    onSaved={handleEditSaved}
                  />
                </div>
              ) : (
                <>
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleExpand(tarea.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-text-main text-sm">{tarea.titulo}</h4>
                      <span className={`text-xs px-2.5 py-1 rounded-md border border-transparent font-medium ${estadoColors[tarea.estado]}`}>
                        {estadoLabels[tarea.estado]}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-text-muted">
                      {tarea.responsable && (
                        <span className="flex items-center">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {tarea.responsable.nombre}
                        </span>
                      )}
                      {tarea.fecha_limite && (
                        <span className="flex items-center text-error/90">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Vence: {new Date(tarea.fecha_limite).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {tareaExpandida === tarea.id && (
                    <div className="p-4 pt-0 border-t border-white/5 mt-2 flex flex-col gap-4">
                      {tarea.descripcion && (
                        <p className="text-sm text-text-muted mt-3">{tarea.descripcion}</p>
                      )}
                      
                      {tarea.archivos && tarea.archivos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-text-muted mb-2">Archivos Adjuntos</p>
                          <div className="flex flex-wrap gap-2">
                            {tarea.archivos.map(archivo => (
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
                      
                      <div className="mt-2 bg-black/20 p-3 rounded-lg">
                        <HistorialTareaTimeline historial={tarea.historial} />
                      </div>
                      
                      {!isUserLector(user) && (
                        <div className="flex justify-end mt-2">
                          <Button variant="outlined" onClick={() => setEditingTareaId(tarea.id)} className="!min-h-[32px] px-4 py-1 text-xs">
                            Editar / Cambiar Estado
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
