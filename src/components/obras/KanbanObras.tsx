import React, { useState } from 'react';
import { Obra, EstadoObra, estadoObraLabels } from '@/lib/obrasApi';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

interface KanbanObrasProps {
  obras: Obra[];
  onEstadoChange: (obraId: number, nuevoEstado: EstadoObra) => Promise<void>;
}

export function KanbanObras({ obras, onEstadoChange }: KanbanObrasProps) {
  const [draggedObraId, setDraggedObraId] = useState<number | null>(null);

  // Columnas del kanban
  const columnas: { id: EstadoObra; title: string }[] = [
    { id: EstadoObra.pendiente, title: 'Pendiente' },
    { id: EstadoObra.enEjecucion, title: 'En Ejecución' },
    { id: EstadoObra.enPausa, title: 'Pausada' },
    { id: EstadoObra.finalizada, title: 'Finalizada' },
    { id: EstadoObra.entregada, title: 'Entregada' },
  ];

  const getColumnColor = (estado: EstadoObra) => {
    switch (estado) {
      case EstadoObra.enEjecucion: return 'border-t-brand-blue';
      case EstadoObra.finalizada:
      case EstadoObra.entregada: return 'border-t-success';
      case EstadoObra.enPausa:
      case EstadoObra.archivada: return 'border-t-accent-muted';
      default: return 'border-t-white/20';
    }
  };

  const getCardColor = (estado: EstadoObra) => {
    switch (estado) {
      case EstadoObra.enEjecucion:
        return 'text-accent bg-accent/10 border-accent/20';
      case EstadoObra.finalizada:
      case EstadoObra.entregada:
        return 'text-success bg-success/10 border-success/20';
      case EstadoObra.enPausa:
      case EstadoObra.archivada:
        return 'text-accent-muted bg-accent-muted/10 border-accent-muted/20';
      default:
        return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedObraId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Para Firefox compatibilidad
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: EstadoObra) => {
    e.preventDefault();
    if (draggedObraId !== null) {
      const obra = obras.find(o => o.id === draggedObraId);
      if (obra && obra.estado !== nuevoEstado) {
        await onEstadoChange(draggedObraId, nuevoEstado);
      }
    }
    setDraggedObraId(null);
  };

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 custom-scrollbar flex-nowrap">
      {columnas.map(col => {
        const columnObras = obras.filter(o => o.estado === col.id);
        
        return (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-80 bg-surface/20 rounded-xl border border-white/5 flex flex-col h-full min-h-[60vh]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Header Columna */}
            <div className={`p-4 border-b border-white/10 bg-surface/40 rounded-t-xl border-t-4 ${getColumnColor(col.id)} flex justify-between items-center`}>
              <h3 className="font-bold text-text-main">{col.title}</h3>
              <span className="bg-white/10 text-text-muted text-xs font-bold px-2 py-0.5 rounded-full">
                {columnObras.length}
              </span>
            </div>
            
            {/* Contenido Columna */}
            <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {columnObras.map(obra => (
                <div 
                  key={obra.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, obra.id)}
                  onDragEnd={() => setDraggedObraId(null)}
                >
                  <Link href={`/obras/${obra.id}`}>
                    <GlassCard 
                      padding="p-4" 
                      className={`cursor-grab active:cursor-grabbing hover:bg-surface/70 transition-colors group ${draggedObraId === obra.id ? 'opacity-50 border-dashed' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="flex items-center text-[10px] font-mono text-text-muted bg-white/10 px-2 py-0.5 rounded">
                          {obra.codigo}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCardColor(obra.estado)}`}>
                          {estadoObraLabels[obra.estado]}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-text-main mb-1 group-hover:text-accent transition-colors line-clamp-2">
                        {obra.nombre}
                      </h4>
                      {obra.cliente && (
                        <p className="text-xs text-text-muted mb-3 line-clamp-1">{obra.cliente}</p>
                      )}
                      
                      <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-text-muted mt-auto">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-main">{obra.total_visitas}</span>
                          <span>Visitas</span>
                        </div>
                        <div className="flex flex-col items-end w-[50%]">
                          <div className="flex justify-between w-full mb-1">
                            <span>Avance</span>
                            <span className="font-bold text-brand-blue">{obra.progreso_porcentaje ?? 0}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div 
                              className="bg-brand-blue h-full rounded-full transition-all duration-500" 
                              style={{ width: `${obra.progreso_porcentaje ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </div>
              ))}
              
              {columnObras.length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-text-muted text-sm font-medium">
                  Arrastra aquí
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
