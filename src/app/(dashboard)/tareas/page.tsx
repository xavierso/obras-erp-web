'use client';
import { useEffect, useState } from 'react';
import { tareasApi, Tarea } from '@/lib/tareasApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { KanbanTareas } from '@/components/tareas/KanbanTareas';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function TareasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [obrasData, tareasData] = await Promise.all([
        obrasApi.listar(),
        tareasApi.listar()
      ]);
      setObras(obrasData);
      setTareas(tareasData);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-20 text-text-muted">Cargando tareas...</div>;
  if (error) return <div className="text-error p-4">{error}</div>;

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return '#3b82f6';
      case 'EN_PROGRESO': return '#f59e0b';
      case 'COMPLETADA': return '#22c55e';
      case 'VENCIDA': return '#ef4444';
      default: return '#3b82f6';
    }
  };
  
  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PROGRESO': return 'En Progreso';
      case 'COMPLETADA': return 'Completada';
      case 'VENCIDA': return 'Vencida';
      default: return estado;
    }
  };
  
  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
      case 'EN_PROGRESO': return 'text-warning bg-warning/10 border-warning/20';
      case 'COMPLETADA': return 'text-success bg-success/10 border-success/20';
      case 'VENCIDA': return 'text-error bg-error/10 border-error/20';
      default: return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Tareas y Pendientes</h1>
          <p className="text-sm text-text-muted mt-1">Gestiona las tareas de todas tus obras</p>
        </div>
        
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'kanban' 
                ? 'bg-brand-blue text-white shadow-sm' 
                : 'text-text-muted hover:text-text-main hover:bg-white/5'
            }`}
          >
            Tablero Kanban
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
              viewMode === 'grid' 
                ? 'bg-brand-blue text-white shadow-sm' 
                : 'text-text-muted hover:text-text-main hover:bg-white/5'
            }`}
          >
            Vista Grid
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {tareas.length === 0 ? (
          <GlassCard className="text-center py-12 flex flex-col items-center justify-center space-y-4 h-full">
            <p className="text-text-muted">No hay tareas registradas en ninguna obra actualmente.</p>
            <Link href="/obras" className="inline-block mt-4">
              <Button variant="primary" fullWidth={false} className="px-6 py-2 min-h-[40px]">
                Ir a Obras para crear una tarea
              </Button>
            </Link>
          </GlassCard>
        ) : viewMode === 'kanban' ? (
          <KanbanTareas 
            tareas={tareas} 
            obras={obras} 
            onRefresh={fetchData} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-6 h-full">
            {tareas.map(tarea => {
              const obra = obras.find(o => o.id === tarea.obra_id);
              return (
                <Link key={tarea.id} href={`/obras/${tarea.obra_id}`} className="block h-full">
                  <GlassCard padding="p-5" className="hover:bg-surface/70 transition-colors h-full flex flex-col cursor-pointer group border-l-4" style={{
                    borderLeftColor: getEstadoColor(tarea.estado)
                  }}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="flex items-center text-xs font-semibold text-text-main bg-white/10 px-2.5 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(tarea.created_at).toLocaleDateString()}
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getEstadoClasses(tarea.estado)}`}>
                        {getEstadoLabel(tarea.estado)}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-text-main mb-1 group-hover:text-accent transition-colors line-clamp-1">
                      {tarea.titulo}
                    </h3>
                    
                    <p className="text-sm text-text-muted mb-4 line-clamp-2">
                      {obra ? `${obra.codigo} - ${obra.nombre}` : `Obra #${tarea.obra_id}`}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center text-xs text-text-muted">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-accent opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate max-w-[120px]">
                          {tarea.responsable?.nombre || 'Sin asignar'}
                        </span>
                      </div>
                      {tarea.fecha_limite && (
                        <span className="text-error/90 flex items-center">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(tarea.fecha_limite).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
