'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { presupuestosApi, PresupuestoResumen } from '@/lib/presupuestosApi';
import Link from 'next/link';

export default function PresupuestosGlobalPage() {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  const cargarPresupuestos = async () => {
    try {
      const data = await presupuestosApi.listarTodos();
      setPresupuestos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async () => {
    if (!nuevoNombre.trim()) return;
    try {
      setCreando(true);
      const nuevo = await presupuestosApi.crear({
        nombre: nuevoNombre,
        obra_id: null as any,
        descripcion: "",
        iva: 21,
        es_version_activa: true,
        capitulos: []
      } as any);
      window.location.href = `/presupuestos/${nuevo.id}`;
    } catch (e) {
      alert("Error al crear presupuesto");
      setCreando(false);
    }
  };

  const handleExportarExcel = async () => {
    try {
      await presupuestosApi.exportarExcel();
    } catch (error) {
      console.error(error);
      alert("Error al exportar a Excel");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-main">Todos los Presupuestos</h1>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <Button variant="outlined" onClick={handleExportarExcel} className="w-full sm:w-auto">Exportar a Excel</Button>
          <Button onClick={() => { setNuevoNombre(''); setShowModal(true); }} className="w-full sm:w-auto">Crear Presupuesto (Estudio)</Button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard padding="p-6" className="w-full max-w-md animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Nuevo Presupuesto</h2>
            <p className="text-sm text-text-muted mb-4">Introduce el nombre descriptivo para este nuevo presupuesto de estudio.</p>
            <div className="mb-6">
              <input 
                type="text" 
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                autoFocus
                placeholder="Ej. Reforma Integral Vivienda A"
                className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue outline-none" 
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setShowModal(false)} disabled={creando}>Cancelar</Button>
              <Button variant="primary" onClick={handleCrear} disabled={creando || !nuevoNombre.trim()}>
                {creando ? 'Creando...' : 'Crear Presupuesto'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {loading ? (
        <p>Cargando presupuestos...</p>
      ) : (
        <KanbanBoard 
          presupuestos={presupuestos} 
          onStatusChange={async (id, newState) => {
            try {
              // Update local state immediately for snappy UI
              setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, estado: newState } : p));
              await presupuestosApi.cambiarEstado(id, newState);
              // toast.success("Estado actualizado");
            } catch(e) {
              console.error('Error al actualizar estado en Kanban:', e);
              alert(`Error al cambiar estado: ${e instanceof Error ? e.message : 'Error desconocido'}`);
              cargarPresupuestos(); // Revert on error
            }
          }}
        />
      )}
    </div>
  );
}

// Kanban Board Component
const KANBAN_COLUMNS: { id: string, label: string, states: string[] }[] = [
  { id: 'borrador', label: 'Borrador / Estudio', states: ['borrador'] },
  { id: 'grupo_enviado', label: 'Pdte. Respuesta', states: ['enviado', 'pendiente_aprobacion'] },
  { id: 'grupo_aprobado', label: 'Aprobados / Ejec', states: ['aprobado', 'en_ejecucion'] },
  { id: 'finalizado', label: 'Finalizado', states: ['finalizado'] },
  { id: 'cancelado', label: 'Cancelado', states: ['cancelado'] }
];

function KanbanBoard({ presupuestos, onStatusChange }: { presupuestos: PresupuestoResumen[], onStatusChange: (id: number, status: any) => void }) {
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const handleDragStart = (e: any, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: any, targetState: string) => {
    e.preventDefault();
    if (draggedId !== null) {
      const p = presupuestos.find(p => p.id === draggedId);
      if (p && !KANBAN_COLUMNS.find(c => c.states.includes(targetState))?.states.includes(p.estado)) {
        onStatusChange(draggedId, targetState);
      }
    }
    setDraggedId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x w-full">
      {KANBAN_COLUMNS.map(col => {
        const items = presupuestos.filter(p => col.states.includes(p.estado));
        const targetState = col.states[0]; // when dropped here, assign the first state of this group
        
        return (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-80 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col snap-start min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, targetState)}
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-sm text-text-muted uppercase tracking-wider">{col.label}</h3>
              <span className="bg-white/10 text-xs px-2 py-1 rounded-full">{items.length}</span>
            </div>
            
            <div className="flex flex-col gap-3 flex-1">
              {items.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`cursor-grab active:cursor-grabbing transition-transform ${draggedId === p.id ? 'opacity-50 scale-95' : 'opacity-100 hover:scale-[1.02]'}`}
                >
                  <Link href={`/presupuestos/${p.id}`} draggable={false}>
                    <GlassCard interactive padding="p-4" className="border-white/10 shadow-lg pointer-events-none">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm line-clamp-2 text-text-main">
                          {p.codigo && <span className="text-brand-blue font-mono mr-1">{p.codigo}</span>}
                          {p.nombre}
                        </h4>
                      </div>
                      
                      <div className="text-xs text-text-muted mb-3 line-clamp-1">
                        {p.obra_id ? `Obra #${p.obra_id}` : 'Independiente'}
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <div className="text-[10px] text-text-muted uppercase">Total</div>
                        <div className="font-bold text-accent">
                          {p.total != null ? p.total.toLocaleString('es-ES') : '0'} €
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </div>
              ))}
              
              {items.length === 0 && (
                <div className="flex-1 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-xs text-white/20">
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
