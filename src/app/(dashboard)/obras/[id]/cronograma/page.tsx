'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { cronogramaApi, ActividadCronograma, EstadoActividad } from '@/lib/cronogramaApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { isUserAdmin, isUserDirector } from '@/lib/authApi';
import { AdvancedGantt } from '@/components/cronograma/AdvancedGantt';
import { toast } from 'react-hot-toast';

export default function CronogramaPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  const { user } = useAuth();
  const canDelete = isUserAdmin(user) || isUserDirector(user);
  const canEdit = canDelete; // simplificación

  const [obra, setObra] = useState<Obra | null>(null);
  const [actividades, setActividades] = useState<ActividadCronograma[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formInicio, setFormInicio] = useState('');
  const [formFin, setFormFin] = useState('');
  const [formAvance, setFormAvance] = useState(0);
  const [formEsHito, setFormEsHito] = useState(false);

  useEffect(() => {
    fetchData();
  }, [obraId]);

  const fetchData = async () => {
    try {
      const [obraData, actData] = await Promise.all([
        obrasApi.obtener(obraId),
        cronogramaApi.listarPorObra(obraId)
      ]);
      setObra(obraData);
      setActividades(actData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (act?: ActividadCronograma) => {
    if (act) {
      setEditingId(act.id);
      setFormNombre(act.nombre);
      setFormInicio(act.fecha_inicio);
      setFormFin(act.fecha_fin_prevista);
      setFormAvance(act.porcentaje_avance);
      setFormEsHito(act.es_hito || false);
    } else {
      setEditingId(null);
      setFormNombre('');
      setFormInicio('');
      setFormFin('');
      setFormAvance(0);
      setFormEsHito(false);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await cronogramaApi.actualizar(editingId, {
          nombre: formNombre,
          fecha_inicio: formInicio,
          fecha_fin_prevista: formFin,
          porcentaje_avance: formAvance,
          es_hito: formEsHito,
        });
        toast.success('Actividad actualizada');
      } else {
        await cronogramaApi.crear({
          obra_id: obraId,
          nombre: formNombre,
          fecha_inicio: formInicio,
          fecha_fin_prevista: formFin,
          porcentaje_avance: formAvance,
          es_hito: formEsHito,
        });
        toast.success('Actividad creada');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar la actividad');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return;
    try {
      await cronogramaApi.eliminar(id);
      toast.success('Actividad eliminada');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar la actividad');
    }
  };

  const handleUpdateFechas = async (id: number, inicio: string, fin: string) => {
    try {
      // Optistic UI update
      setActividades(prev => prev.map(a => a.id === id ? { ...a, fecha_inicio: inicio, fecha_fin_prevista: fin } : a));
      
      await cronogramaApi.actualizar(id, {
        fecha_inicio: inicio,
        fecha_fin_prevista: fin
      });
      toast.success('Fechas actualizadas');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Error al actualizar las fechas');
      fetchData(); // revert
    }
  };

  const handleAddDependency = async (fromId: number, toId: number) => {
    const toAct = actividades.find(a => a.id === toId);
    if (!toAct) return;
    
    // Evitar duplicados
    if (toAct.predecesoras_ids?.includes(fromId)) {
      toast.error('La dependencia ya existe');
      return;
    }
    
    // Evitar ciclo básico
    if (fromId === toId) return;

    try {
      const newPredecesoras = [...(toAct.predecesoras_ids || []), fromId];
      
      // Optistic UI update
      setActividades(prev => prev.map(a => a.id === toId ? { ...a, predecesoras_ids: newPredecesoras } : a));
      
      await cronogramaApi.actualizar(toId, {
        predecesoras_ids: newPredecesoras
      });
      toast.success('Dependencia añadida');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Error al crear la dependencia');
      fetchData(); // revert
    }
  };

  if (loading) return <div>Cargando cronograma...</div>;
  if (!obra) return <div>Obra no encontrada</div>;

  // Cálculos básicos
  const total = actividades.length;
  const completadas = actividades.filter(a => a.estado === 'completada').length;
  const retrasadas = actividades.filter(a => a.estado === 'retrasada').length;
  const enEjecucion = actividades.filter(a => a.estado === 'en_ejecucion').length;
  const noIniciadas = actividades.filter(a => a.estado === 'no_iniciada').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start md:items-center space-x-4">
          <button onClick={() => router.back()} className="text-text-muted hover:text-accent transition-colors mt-1 md:mt-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main flex items-center space-x-3">
              <span>{obra.nombre}</span>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded-md uppercase tracking-widest ml-2 shadow-sm">Cronograma</span>
            </h1>
            <p className="text-text-muted text-sm font-mono mt-1">{obra.codigo}</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => openForm()} fullWidth={false} className="!min-h-[40px] px-5 py-2">
            + Nueva Actividad
          </Button>
        )}
      </div>

      {/* Resumen Superior */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard padding="p-4" className="text-center">
           <div className="text-text-muted text-xs mb-1">TOTAL</div>
           <div className="text-xl font-bold">{total}</div>
        </GlassCard>
        <GlassCard padding="p-4" className="text-center border-b-2 border-green-500">
           <div className="text-text-muted text-xs mb-1">COMPLETADAS</div>
           <div className="text-xl font-bold">{completadas}</div>
        </GlassCard>
        <GlassCard padding="p-4" className="text-center border-b-2 border-blue-500">
           <div className="text-text-muted text-xs mb-1">EN EJECUCIÓN</div>
           <div className="text-xl font-bold">{enEjecucion}</div>
        </GlassCard>
        <GlassCard padding="p-4" className="text-center border-b-2 border-red-500">
           <div className="text-text-muted text-xs mb-1">RETRASADAS</div>
           <div className="text-xl font-bold">{retrasadas}</div>
        </GlassCard>
        <GlassCard padding="p-4" className="text-center border-b-2 border-gray-400">
           <div className="text-text-muted text-xs mb-1">NO INICIADAS</div>
           <div className="text-xl font-bold">{noIniciadas}</div>
        </GlassCard>
      </div>

      {/* Gantt Visual View */}
      <GlassCard padding="p-0" className="overflow-hidden relative z-0">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div>
            <h2 className="text-lg font-bold text-text-main">Diagrama de Gantt</h2>
            <p className="text-xs text-text-muted mt-1">Arrastra las barras para mover o redimensionar. Arrastra desde el círculo derecho de una barra hacia otra para crear dependencias.</p>
          </div>
        </div>
        
        {actividades.length === 0 ? (
          <div className="p-6 text-text-muted text-center">No hay actividades aún.</div>
        ) : (
          <AdvancedGantt 
            actividades={actividades}
            canEdit={canEdit}
            onEdit={openForm}
            onDelete={handleDelete}
            onUpdateFechas={handleUpdateFechas}
            onAddDependency={handleAddDependency}
          />
        )}
      </GlassCard>

      {/* Modal Crear / Editar */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-text-main">
              {editingId ? 'Editar Actividad' : 'Nueva Actividad'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Nombre</label>
                <input required type="text" className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue focus:outline-none transition-colors" value={formNombre} onChange={e => setFormNombre(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Inicio</label>
                  <input required type="date" className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue focus:outline-none transition-colors" value={formInicio} onChange={e => setFormInicio(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Fin Previsto</label>
                  <input required type="date" className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue focus:outline-none transition-colors" value={formFin} onChange={e => setFormFin(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Avance</label>
                  <span className="text-xs font-bold text-brand-blue">{formAvance}%</span>
                </div>
                <input type="range" min="0" max="100" className="w-full accent-brand-blue" value={formAvance} onChange={e => setFormAvance(parseInt(e.target.value, 10))} />
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox" 
                  id="es_hito" 
                  checked={formEsHito} 
                  onChange={e => setFormEsHito(e.target.checked)} 
                  className="w-4 h-4 rounded border-white/10 bg-surface accent-brand-blue" 
                />
                <label htmlFor="es_hito" className="text-sm font-semibold text-text-main cursor-pointer">
                  Marcar como Hito (Milestone)
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10 mt-6">
                <Button variant="text" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingId ? 'Actualizar' : 'Guardar'}</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
