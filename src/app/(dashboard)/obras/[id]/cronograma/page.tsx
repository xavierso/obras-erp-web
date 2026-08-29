'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { cronogramaApi, ActividadCronograma, EstadoActividad } from '@/lib/cronogramaApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { isUserAdmin, isUserDirector } from '@/lib/authApi';
import { Pencil, Trash2 } from 'lucide-react';

export default function CronogramaPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  const { user } = useAuth();
  const canDelete = isUserAdmin(user) || isUserDirector(user);

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
      } else {
        await cronogramaApi.crear({
          obra_id: obraId,
          nombre: formNombre,
          fecha_inicio: formInicio,
          fecha_fin_prevista: formFin,
          porcentaje_avance: formAvance,
          es_hito: formEsHito,
        });
      }
      setIsFormOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error al guardar la actividad');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta actividad?')) return;
    try {
      await cronogramaApi.eliminar(id);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar la actividad');
    }
  };

  const getStatusColor = (estado: EstadoActividad) => {
    switch (estado) {
      case 'completada': return 'bg-green-500';
      case 'en_ejecucion': return 'bg-blue-500';
      case 'retrasada': return 'bg-red-500';
      case 'cancelada': return 'bg-gray-800';
      default: return 'bg-gray-400';
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
        <Button onClick={() => openForm()} fullWidth={false} className="!min-h-[40px] px-5 py-2">
          + Nueva Actividad
        </Button>
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
      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-main">Diagrama de Gantt</h2>
        </div>
        
        {actividades.length === 0 ? (
          <div className="p-6 text-text-muted">No hay actividades aún.</div>
        ) : (
          (() => {
            const parseDate = (d: string) => new Date(d);
            let minDate = new Date();
            let maxDate = new Date();

            if (actividades.length > 0) {
              minDate = new Date(Math.min(...actividades.map(a => parseDate(a.fecha_inicio).getTime())));
              maxDate = new Date(Math.max(...actividades.map(a => parseDate(a.fecha_fin_prevista).getTime())));
            }

            // Buffer de días
            minDate.setDate(minDate.getDate() - 2);
            maxDate.setDate(maxDate.getDate() + 4);
            
            // Garantizar mínimo de 14 días
            const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 14) {
              maxDate.setDate(maxDate.getDate() + (14 - diffDays));
            }

            const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysArray = Array.from({length: totalDays + 1}, (_, i) => {
              const d = new Date(minDate);
              d.setDate(d.getDate() + i);
              return d;
            });

            // Agrupar por meses para la cabecera
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
              <div className="overflow-x-auto custom-scrollbar pb-6">
                <div className="min-w-max">
                  {/* Grid Layout Principal */}
                  <div 
                    className="grid border-b border-white/5" 
                    style={{ gridTemplateColumns: `260px repeat(${daysArray.length}, minmax(36px, 1fr))` }}
                  >
                    {/* Header: Meses */}
                    <div className="bg-surface/50 border-r border-white/10 p-3 font-semibold text-text-muted text-xs uppercase tracking-wider flex items-end">
                      Actividad
                    </div>
                    {months.map((m, i) => (
                      <div 
                        key={i} 
                        className="bg-surface/50 border-r border-white/5 p-2 font-semibold text-text-main text-xs uppercase text-center truncate"
                        style={{ gridColumn: `span ${m.span}` }}
                      >
                        {m.monthName}
                      </div>
                    ))}
                    
                    {/* Header: Días */}
                    <div className="border-r border-white/10 bg-surface/30"></div>
                    {daysArray.map((d, i) => (
                      <div 
                        key={i} 
                        className={`text-center py-2 text-xs border-r border-white/5 bg-surface/30 ${d.getDay() === 0 || d.getDay() === 6 ? 'bg-white/5 text-text-muted' : 'text-text-main'}`}
                      >
                        <div className="font-bold">{d.getDate()}</div>
                        <div className="text-[9px] opacity-70">{d.toLocaleString('es-ES', { weekday: 'short' }).charAt(0)}</div>
                      </div>
                    ))}

                    {/* Filas de Actividades */}
                    {actividades.map(act => {
                      const start = parseDate(act.fecha_inicio);
                      const end = parseDate(act.fecha_fin_prevista);
                      
                      const startOffset = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include end day

                      return (
                        <React.Fragment key={act.id}>
                          {/* Columna de nombre y acciones */}
                          <div className="border-r border-b border-white/10 p-3 flex items-center justify-between group bg-surface/20 hover:bg-surface/50 transition-colors">
                            <div className="overflow-hidden">
                              <div className="font-semibold text-sm text-text-main truncate" title={act.nombre}>{act.nombre}</div>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase text-white ${getStatusColor(act.estado)}`}>
                                  {act.estado.replace('_', ' ')}
                                </span>
                                {act.es_hito && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border border-brand-blue text-brand-blue">
                                    Hito
                                  </span>
                                )}
                                {!act.es_hito && <span className="text-[10px] text-text-muted font-mono">{act.porcentaje_avance}%</span>}
                              </div>
                            </div>
                            
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                              <button onClick={() => openForm(act)} className="p-1 text-text-muted hover:text-brand-blue" title="Editar">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {canDelete && (
                                <button onClick={() => handleDelete(act.id)} className="p-1 text-text-muted hover:text-error" title="Eliminar">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Celdas del grid (fondo) */}
                          <div 
                            className="border-b border-white/5 relative bg-surface/10 hover:bg-surface/30 transition-colors flex items-center" 
                            style={{ gridColumn: `2 / span ${daysArray.length}` }}
                          >
                            {/* Líneas de fin de semana en el fondo (opcional, simplificado) */}
                            {/* Renderizar Hito o Barra Normal */}
                            {act.es_hito ? (
                              <div 
                                className="absolute flex items-center group/hito"
                                style={{ 
                                  left: `calc((${startOffset} / ${daysArray.length}) * 100%)`, 
                                  marginLeft: '-6px' 
                                }}
                              >
                                <div className={`w-4 h-4 rotate-45 ${getStatusColor(act.estado)} shadow-md border-2 border-surface/50 z-20`}></div>
                                <span className="ml-3 text-[10px] font-bold text-text-main opacity-0 group-hover/hito:opacity-100 transition-opacity whitespace-nowrap z-30 drop-shadow-md">
                                  {act.nombre}
                                </span>
                              </div>
                            ) : (
                              <div 
                                className={`absolute h-7 rounded-md ${getStatusColor(act.estado)} opacity-90 shadow-sm flex items-center overflow-hidden`}
                                style={{ 
                                  left: `calc((${startOffset} / ${daysArray.length}) * 100%)`, 
                                  width: `calc((${duration} / ${daysArray.length}) * 100%)`,
                                  minWidth: '4px'
                                }}
                              >
                                {/* Relleno de porcentaje dentro de la barra */}
                                <div 
                                  className="absolute top-0 left-0 h-full bg-white/30"
                                  style={{ width: `${act.porcentaje_avance}%` }}
                                />
                                <span className="relative z-10 text-[10px] font-bold text-white px-2 truncate mix-blend-overlay">
                                  {act.nombre}
                                </span>
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
          })()
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
