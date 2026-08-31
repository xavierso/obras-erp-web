import React, { useState } from 'react';
import { Tarea, EstadoTarea, tareasApi } from '@/lib/tareasApi';
import { Obra } from '@/lib/obrasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface KanbanTareasProps {
  tareas: Tarea[];
  obras: Obra[];
  onRefresh: () => void;
}

const columnas = [
  { id: EstadoTarea.PENDIENTE, title: 'Pendiente', color: 'border-brand-blue/50' },
  { id: EstadoTarea.EN_PROGRESO, title: 'En Progreso', color: 'border-warning/50' },
  { id: EstadoTarea.COMPLETADA, title: 'Completada', color: 'border-success/50' },
  { id: EstadoTarea.VENCIDA, title: 'Vencida', color: 'border-error/50' },
];

export function KanbanTareas({ tareas, obras, onRefresh }: KanbanTareasProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragStart = (e: React.DragEvent, tareaId: number) => {
    setDraggingId(tareaId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tareaId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: EstadoTarea) => {
    e.preventDefault();
    const tareaIdStr = e.dataTransfer.getData('text/plain');
    if (!tareaIdStr) return;
    
    const tareaId = parseInt(tareaIdStr, 10);
    const tarea = tareas.find(t => t.id === tareaId);
    
    if (!tarea || tarea.estado === nuevoEstado) {
      setDraggingId(null);
      return;
    }

    try {
      setIsUpdating(true);
      await tareasApi.actualizar(tareaId, { estado: nuevoEstado });
      toast.success('Estado de tarea actualizado');
      onRefresh();
    } catch (error) {
      toast.error('Error al actualizar la tarea');
      console.error(error);
    } finally {
      setIsUpdating(false);
      setDraggingId(null);
    }
  };

  return (
    <div className="flex flex-nowrap gap-4 md:gap-6 overflow-x-auto pb-4 custom-scrollbar w-full h-full items-stretch min-h-[500px]">
      {columnas.map(col => {
        const tareasColumna = tareas.filter(t => t.estado === col.id);
        
        return (
          <div 
            key={col.id}
            className={`flex-1 min-w-[280px] max-w-[350px] shrink-0 bg-white/5 rounded-xl flex flex-col border border-white/10 ${draggingId ? 'border-dashed border-white/30' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={`p-4 border-b-2 ${col.color} bg-black/20 flex justify-between items-center rounded-t-xl`}>
              <h3 className="font-semibold text-text-main">{col.title}</h3>
              <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-text-muted">
                {tareasColumna.length}
              </span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar flex flex-col h-full">
              {tareasColumna.map(tarea => {
                const obra = obras.find(o => o.id === tarea.obra_id);
                return (
                  <div
                    key={tarea.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tarea.id)}
                    className={`bg-surface border border-white/10 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-brand-blue/40 hover:shadow-lg transition-all ${draggingId === tarea.id ? 'opacity-50 scale-95' : 'opacity-100'} ${isUpdating && draggingId === tarea.id ? 'animate-pulse' : ''}`}
                  >
                    <Link href={`/obras/${tarea.obra_id}`} className="block">
                      <h4 className="font-medium text-text-main text-sm mb-1 hover:text-brand-blue transition-colors">{tarea.titulo}</h4>
                    </Link>
                    <p className="text-xs text-text-muted mb-3 line-clamp-1">
                      {obra ? `${obra.codigo} - ${obra.nombre}` : `Obra #${tarea.obra_id}`}
                    </p>
                    
                    <div className="flex justify-between items-center text-[10.5px] text-text-muted mt-3 pt-3 border-t border-white/5">
                       <span className="flex items-center truncate max-w-[120px]" title={tarea.responsable?.nombre || 'Sin asignar'}>
                        <svg className="w-3 h-3 mr-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {tarea.responsable?.nombre || 'Sin asignar'}
                      </span>
                      {tarea.fecha_limite && (
                        <span className={`flex items-center ${new Date(tarea.fecha_limite) < new Date() ? 'text-error' : ''}`}>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(tarea.fecha_limite).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {tareasColumna.length === 0 && (
                <div className="flex-1 min-h-[100px] flex items-center justify-center text-center p-4 text-text-muted/40 text-sm border-2 border-dashed border-white/5 rounded-lg mt-2">
                  Arrastra una tarea aquí
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
