import React, { useState, useRef, useEffect } from 'react';
import { ActividadCronograma, EstadoActividad } from '@/lib/cronogramaApi';
import { Pencil, Trash2 } from 'lucide-react';

interface AdvancedGanttProps {
  actividades: ActividadCronograma[];
  canEdit: boolean;
  onEdit: (act: ActividadCronograma) => void;
  onDelete: (id: number) => void;
  onUpdateFechas: (id: number, inicio: string, fin: string) => Promise<void>;
  onAddDependency: (fromId: number, toId: number) => Promise<void>;
}

export function AdvancedGantt({ actividades, canEdit, onEdit, onDelete, onUpdateFechas, onAddDependency }: AdvancedGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [draggingBar, setDraggingBar] = useState<{ id: number; type: 'move' | 'resize-left' | 'resize-right'; startX: number; initialStart: Date; initialEnd: Date } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ startOffset: number; duration: number } | null>(null);

  // Connection state
  const [connecting, setConnecting] = useState<{ fromId: number; startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const dayWidth = 36; // px per day
  const rowHeight = 44; // px per row (3px padding + 28px bar) approximately, but we rely on index

  const parseDate = (d: string) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const addDays = (d: Date, days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  };

  const formatDate = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  let minDate = new Date();
  let maxDate = new Date();

  if (actividades.length > 0) {
    minDate = new Date(Math.min(...actividades.map(a => parseDate(a.fecha_inicio).getTime())));
    maxDate = new Date(Math.max(...actividades.map(a => parseDate(a.fecha_fin_prevista).getTime())));
  }

  minDate.setDate(minDate.getDate() - 2);
  maxDate.setDate(maxDate.getDate() + 4);
  
  const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 14) {
    maxDate.setDate(maxDate.getDate() + (14 - diffDays));
  }

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysArray = Array.from({length: totalDays + 1}, (_, i) => addDays(minDate, i));

  const getStatusColor = (estado: EstadoActividad) => {
    switch (estado) {
      case 'completada': return 'bg-green-500';
      case 'en_ejecucion': return 'bg-blue-500';
      case 'retrasada': return 'bg-red-500';
      case 'cancelada': return 'bg-gray-800';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBorder = (estado: EstadoActividad) => {
    switch (estado) {
      case 'completada': return 'border-green-600';
      case 'en_ejecucion': return 'border-blue-600';
      case 'retrasada': return 'border-red-600';
      case 'cancelada': return 'border-gray-900';
      default: return 'border-gray-500';
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (draggingBar && containerRef.current) {
        const deltaX = e.clientX - draggingBar.startX;
        const deltaDays = Math.round(deltaX / dayWidth);
        
        let newStart = new Date(draggingBar.initialStart);
        let newEnd = new Date(draggingBar.initialEnd);

        if (draggingBar.type === 'move') {
          newStart = addDays(newStart, deltaDays);
          newEnd = addDays(newEnd, deltaDays);
        } else if (draggingBar.type === 'resize-left') {
          newStart = addDays(newStart, deltaDays);
          if (newStart > newEnd) newStart = newEnd;
        } else if (draggingBar.type === 'resize-right') {
          newEnd = addDays(newEnd, deltaDays);
          if (newEnd < newStart) newEnd = newStart;
        }

        const startOffset = Math.max(0, Math.ceil((newStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const duration = Math.max(1, Math.ceil((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        setDragPreview({ startOffset, duration });
      }

      if (connecting && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setConnecting({
          ...connecting,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top
        });
      }
    };

    const handlePointerUp = async (e: PointerEvent) => {
      if (draggingBar) {
        const deltaX = e.clientX - draggingBar.startX;
        const deltaDays = Math.round(deltaX / dayWidth);
        
        if (deltaDays !== 0) {
          let newStart = new Date(draggingBar.initialStart);
          let newEnd = new Date(draggingBar.initialEnd);

          if (draggingBar.type === 'move') {
            newStart = addDays(newStart, deltaDays);
            newEnd = addDays(newEnd, deltaDays);
          } else if (draggingBar.type === 'resize-left') {
            newStart = addDays(newStart, deltaDays);
            if (newStart > newEnd) newStart = newEnd;
          } else if (draggingBar.type === 'resize-right') {
            newEnd = addDays(newEnd, deltaDays);
            if (newEnd < newStart) newEnd = newStart;
          }

          await onUpdateFechas(draggingBar.id, formatDate(newStart), formatDate(newEnd));
        }
        setDraggingBar(null);
        setDragPreview(null);
      }

      if (connecting) {
        // Find if we dropped on another task
        // We use document.elementsFromPoint to find the task row
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const taskRow = elements.find(el => el.getAttribute('data-task-id'));
        if (taskRow) {
          const toId = parseInt(taskRow.getAttribute('data-task-id') || '0', 10);
          if (toId && toId !== connecting.fromId) {
            await onAddDependency(connecting.fromId, toId);
          }
        }
        setConnecting(null);
      }
    };

    if (draggingBar || connecting) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingBar, connecting, minDate, onUpdateFechas, onAddDependency]);

  const handleBarPointerDown = (e: React.PointerEvent, id: number, type: 'move' | 'resize-left' | 'resize-right', initialStart: Date, initialEnd: Date) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingBar({ id, type, startX: e.clientX, initialStart, initialEnd });
  };

  const handleConnectorPointerDown = (e: React.PointerEvent, fromId: number) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      setConnecting({ fromId, startX, startY, currentX: startX, currentY: startY });
    }
  };

  const renderDependencies = () => {
    if (!containerRef.current) return null;
    const lines: React.ReactElement[] = [];

    // Tareas lookup by index
    const actIndex = new Map(actividades.map((a, i) => [a.id, i]));

    actividades.forEach((act) => {
      act.predecesoras_ids?.forEach(predId => {
        const predIdx = actIndex.get(predId);
        const succIdx = actIndex.get(act.id);
        if (predIdx !== undefined && succIdx !== undefined) {
          const predAct = actividades[predIdx];
          const succAct = actividades[succIdx];
          
          const predEnd = parseDate(predAct.fecha_fin_prevista);
          const succStart = parseDate(succAct.fecha_inicio);

          const predEndOffset = Math.ceil((predEnd.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const succStartOffset = Math.ceil((succStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

          const startX = 260 + predEndOffset * dayWidth;
          const startY = 46 + predIdx * 45 + 22; // 46 (header) + row * height + half-height
          
          const endX = 260 + succStartOffset * dayWidth;
          const endY = 46 + succIdx * 45 + 22;

          // Dibujar path curvo
          const path = `M ${startX} ${startY} C ${startX + 20} ${startY}, ${endX - 20} ${endY}, ${endX} ${endY}`;

          lines.push(
            <path 
              key={`${predId}-${act.id}`}
              d={path}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              className="opacity-60"
            />
          );
        }
      });
    });

    if (connecting) {
      const path = `M ${connecting.startX} ${connecting.startY} C ${connecting.startX + 20} ${connecting.startY}, ${connecting.currentX - 20} ${connecting.currentY}, ${connecting.currentX} ${connecting.currentY}`;
      lines.push(
        <path 
          key="connecting"
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="4"
        />
      );
    }

    return (
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" style={{ minWidth: 260 + daysArray.length * dayWidth }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
        </defs>
        {lines}
      </svg>
    );
  };

  const months: { monthName: string; span: number }[] = [];
  let currentMonth = -1;
  let currentMonthSpan = 0;
  
  daysArray.forEach((d, index) => {
    if (d.getMonth() !== currentMonth) {
      if (currentMonth !== -1) {
        months.push({ monthName: daysArray[index-1].toLocaleString('es-ES', { month: 'long', year: 'numeric' }), span: currentMonthSpan });
      }
      currentMonth = d.getMonth();
      currentMonthSpan = 1;
    } else {
      currentMonthSpan++;
    }
    if (index === daysArray.length - 1) {
      months.push({ monthName: d.toLocaleString('es-ES', { month: 'long', year: 'numeric' }), span: currentMonthSpan });
    }
  });

  return (
    <div className="overflow-x-auto custom-scrollbar pb-6 relative select-none" ref={containerRef}>
      {renderDependencies()}
      <div className="min-w-max relative z-0">
        <div 
          className="grid border-b border-white/5 relative" 
          style={{ gridTemplateColumns: `260px repeat(${daysArray.length}, ${dayWidth}px)` }}
        >
          {/* Header */}
          <div className="bg-surface/50 border-r border-white/10 p-3 font-semibold text-text-muted text-xs uppercase tracking-wider flex items-end h-[46px]">
            Actividad
          </div>
          {months.map((m, i) => (
            <div 
              key={i} 
              className="bg-surface/50 border-r border-white/5 p-1 font-semibold text-text-main text-xs uppercase text-center truncate"
              style={{ gridColumn: `span ${m.span}` }}
            >
              {m.monthName}
            </div>
          ))}
          
          <div className="border-r border-white/10 bg-surface/30"></div>
          {daysArray.map((d, i) => (
            <div 
              key={i} 
              className={`text-center py-1 text-[10px] border-r border-white/5 bg-surface/30 ${d.getDay() === 0 || d.getDay() === 6 ? 'bg-white/5 text-text-muted' : 'text-text-main'}`}
            >
              <div className="font-bold">{d.getDate()}</div>
            </div>
          ))}

          {/* Filas */}
          {actividades.map((act, rowIndex) => {
            const start = parseDate(act.fecha_inicio);
            const end = parseDate(act.fecha_fin_prevista);
            
            const startOffset = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const isDragging = draggingBar?.id === act.id;
            const activeStartOffset = isDragging && dragPreview ? dragPreview.startOffset : startOffset;
            const activeDuration = isDragging && dragPreview ? dragPreview.duration : duration;

            return (
              <React.Fragment key={act.id}>
                {/* Info Column */}
                <div 
                  className="border-r border-b border-white/10 p-2 flex items-center justify-between group bg-surface/20 hover:bg-surface/50 transition-colors h-[45px]"
                  data-task-id={act.id}
                >
                  <div className="overflow-hidden">
                    <div className="font-semibold text-[13px] text-text-main truncate" title={act.nombre}>{act.nombre}</div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase text-white ${getStatusColor(act.estado)}`}>
                        {act.estado.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 relative z-20">
                    <button onClick={() => onEdit(act)} className="p-1 text-text-muted hover:text-brand-blue">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {canEdit && (
                      <button onClick={() => onDelete(act.id)} className="p-1 text-text-muted hover:text-error">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Gantt Row */}
                <div 
                  className="border-b border-white/5 relative bg-surface/10 hover:bg-surface/30 transition-colors flex items-center h-[45px]" 
                  style={{ gridColumn: `2 / span ${daysArray.length}` }}
                  data-task-id={act.id} // para drop dependencies
                >
                  {act.es_hito ? (
                    <div 
                      className={`absolute flex items-center group/hito cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
                      style={{ 
                        left: `${activeStartOffset * dayWidth}px`, 
                        marginLeft: '-6px',
                        zIndex: isDragging ? 30 : 20
                      }}
                      onPointerDown={(e) => handleBarPointerDown(e, act.id, 'move', start, end)}
                    >
                      {/* Conector Izquierdo */}
                      <div 
                        className="w-3 h-3 rounded-full bg-white border border-brand-blue absolute -left-3 opacity-0 group-hover/hito:opacity-100 cursor-crosshair z-30" 
                        onPointerDown={(e) => handleConnectorPointerDown(e, act.id)}
                      />
                      
                      <div className={`w-4 h-4 rotate-45 ${getStatusColor(act.estado)} shadow-md border-2 border-surface/50 z-20`}></div>
                      <span className="ml-3 text-[10px] font-bold text-text-main opacity-0 group-hover/hito:opacity-100 transition-opacity whitespace-nowrap z-30 drop-shadow-md pointer-events-none">
                        {act.nombre}
                      </span>
                      
                      {/* Conector Derecho */}
                      <div 
                        className="w-3 h-3 rounded-full bg-white border border-brand-blue absolute -right-3 opacity-0 group-hover/hito:opacity-100 cursor-crosshair z-30" 
                        onPointerDown={(e) => handleConnectorPointerDown(e, act.id)}
                      />
                    </div>
                  ) : (
                    <div 
                      className={`absolute h-6 rounded-md ${getStatusColor(act.estado)} opacity-90 shadow-sm flex items-center group/bar ${isDragging ? 'opacity-50' : 'hover:opacity-100'} border border-white/20`}
                      style={{ 
                        left: `${activeStartOffset * dayWidth}px`, 
                        width: `${activeDuration * dayWidth}px`,
                        minWidth: '10px',
                        zIndex: isDragging ? 30 : 20
                      }}
                    >
                      {/* Relleno progreso */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-white/30 pointer-events-none"
                        style={{ width: `${act.porcentaje_avance}%` }}
                      />
                      
                      {/* Left Resize Handle */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50 rounded-l-md z-30"
                        onPointerDown={(e) => handleBarPointerDown(e, act.id, 'resize-left', start, end)}
                      />
                      
                      {/* Move Handle (Center) */}
                      <div 
                        className="flex-1 h-full cursor-grab active:cursor-grabbing z-20 flex items-center px-2 overflow-hidden"
                        onPointerDown={(e) => handleBarPointerDown(e, act.id, 'move', start, end)}
                      >
                         <span className="text-[10px] font-bold text-white truncate mix-blend-overlay pointer-events-none">
                          {act.nombre}
                        </span>
                      </div>
                      
                      {/* Right Resize Handle */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/50 rounded-r-md z-30"
                        onPointerDown={(e) => handleBarPointerDown(e, act.id, 'resize-right', start, end)}
                      />

                      {/* Right Connector Handle for Dependencies */}
                      <div 
                        className="absolute -right-1.5 top-1.5 w-3 h-3 rounded-full bg-white border border-brand-blue opacity-0 group-hover/bar:opacity-100 cursor-crosshair shadow-md z-40 transition-opacity"
                        onPointerDown={(e) => handleConnectorPointerDown(e, act.id)}
                        title="Arrastra a otra tarea para crear dependencia"
                      />
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
