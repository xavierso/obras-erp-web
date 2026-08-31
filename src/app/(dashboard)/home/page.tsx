'use client';
import { useEffect, useState } from 'react';
import { dashboardApi, ResumenDashboard } from '@/lib/dashboardApi';
import { obrasApi, Obra, estadoObraLabels, EstadoObra } from '@/lib/obrasApi';
import { citasApi, CitaVisita } from '@/lib/citasApi';
import { tareasApi, Tarea, EstadoTarea } from '@/lib/tareasApi';
import { calendarioApi, EventoCalendarioOut } from '@/lib/calendarioApi';
import { presupuestosApi, PresupuestoResumen, estadoPresupuestoLabels } from '@/lib/presupuestosApi';
import { Dropdown } from '@/components/ui/Dropdown';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { 
  Briefcase, 
  MapPin, 
  CalendarDays, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ArrowRight,
  TrendingUp,
  Activity,
  CheckSquare,
  Calculator
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [obrasRecientes, setObrasRecientes] = useState<Obra[]>([]);
  const [eventosPendientes, setEventosPendientes] = useState<EventoCalendarioOut[]>([]);
  const [tareasPendientes, setTareasPendientes] = useState<Tarea[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([]);
  const [filtroPresupuesto, setFiltroPresupuesto] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, obrasData, eventosData, tareasData, presupuestosData] = await Promise.all([
          dashboardApi.obtenerResumen(),
          obrasApi.listar(),
          calendarioApi.listar({ fecha_inicio: new Date().toISOString().split('T')[0] }),
          tareasApi.listar({ limit: 5 }),
          presupuestosApi.listarTodos()
        ]);
        setResumen(dashboardData);
        setObrasRecientes(obrasData.slice(0, 3));
        
        const upcoming = eventosData
          .filter(e => e.estado !== 'completada' && e.estado !== 'completado')
          .slice(0, 5);
          
        setEventosPendientes(upcoming);
        setTareasPendientes(tareasData.filter(t => t.estado !== EstadoTarea.COMPLETADA).slice(0, 5));
        setPresupuestos(presupuestosData.slice(0, 8));
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getEstadoColor = (estado: EstadoObra) => {
    switch (estado) {
      case EstadoObra.enEjecucion: return 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
      case EstadoObra.finalizada:
      case EstadoObra.entregada: return 'text-success bg-success/10 border-success/20';
      case EstadoObra.enPausa:
      case EstadoObra.archivada: return 'text-text-muted bg-white/5 border-white/10';
      default: return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin"></div>
      <p className="text-text-muted font-medium tracking-wide">Iniciando entorno...</p>
    </div>
  );
  if (error) return <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl">{error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <p className="text-sm font-semibold text-brand-blue mb-1 tracking-wider uppercase">Panel de Control</p>
          <h1 className="text-3xl md:text-4xl font-bold text-text-main tracking-tight">
            Buenos días, {user?.nombre || 'Inspector'}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted bg-surface/50 px-4 py-2 rounded-full border border-white/5">
          <Activity className="w-4 h-4 text-success" />
          <span>Sistema en línea</span>
        </div>
      </div>

      {/* EMPTY STATE PARA NUEVAS CUENTAS */}
      {obrasRecientes.length === 0 && resumen && resumen.obras_activas === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-brand-blue/30 rounded-2xl bg-brand-blue/5">
          <div className="w-24 h-24 bg-brand-blue/20 rounded-full flex items-center justify-center mb-6">
            <Briefcase className="w-12 h-12 text-brand-blue" />
          </div>
          <h2 className="text-2xl font-bold text-text-main mb-3">¡Bienvenido a DIAM!</h2>
          <p className="text-text-muted mb-8 max-w-md text-base">
            Tu panel de control está listo. Para empezar a visualizar métricas y organizar el trabajo, crea tu primera obra.
          </p>
          <Link href="/obras/nuevo">
            <button className="px-8 py-3 bg-brand-blue hover:bg-brand-blue-light text-white font-bold rounded-full transition-all shadow-[0_0_20px_rgba(0,80,158,0.4)]">
              Crear mi primera obra
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* STATS ROW */}
          {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard padding="p-5" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Briefcase className="w-16 h-16 text-brand-blue" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue"></span> Obras Activas
              </p>
              <p className="text-4xl font-bold text-text-main">{resumen.obras_activas}</p>
            </div>
          </GlassCard>

          <GlassCard padding="p-5" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-16 h-16 text-brand-blue-light" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue-light"></span> Visitas Hoy
              </p>
              <p className="text-4xl font-bold text-text-main">{resumen.visitas_hoy}</p>
            </div>
          </GlassCard>

          <GlassCard padding="p-5" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CalendarDays className="w-16 h-16 text-warning" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning"></span> Visitas Semana
              </p>
              <p className="text-4xl font-bold text-text-main">{resumen.visitas_semana}</p>
            </div>
          </GlassCard>

          <GlassCard padding="p-5" className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-16 h-16 text-success" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span> Docs (7 días)
              </p>
              <p className="text-4xl font-bold text-text-main">{resumen.documentos_nuevos_semana}</p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* DASHBOARD CHARTS */}
      <DashboardCharts presupuestos={presupuestos} obras={obrasRecientes} />

      {/* AVANCE DE OBRAS SECTION */}
      {resumen && resumen.obras_avance.length > 0 && (
        <div className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-blue" />
              Avance de Obras
            </h2>
            {resumen.actividades_retrasadas_total > 0 && (
              <div className="bg-error/10 border border-error/20 px-3 py-1 rounded-full flex items-center text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-error mr-1.5" />
                <span className="text-error font-bold">{resumen.actividades_retrasadas_total} actividades retrasadas</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumen.obras_avance.map(oa => (
              <Link key={oa.id} href={`/obras/${oa.id}/cronograma`} className="block">
                <GlassCard interactive padding="p-4" className="hover:border-brand-blue/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm text-text-main truncate pr-2">{oa.nombre}</h3>
                    <span className="text-xs font-bold text-brand-blue">{oa.progreso_porcentaje}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 border border-white/10 overflow-hidden">
                    <div 
                      className="bg-brand-blue h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${oa.progreso_porcentaje}%` }}
                    ></div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TWO COLUMNS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* EVENTS LIST */}
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-blue" />
              Próximos Eventos
            </h2>
            <Link href="/calendario" className="text-xs font-semibold text-text-muted hover:text-brand-blue transition-colors flex items-center gap-1">
              Ver calendario <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          {eventosPendientes.length === 0 ? (
            <GlassCard className="text-center py-10">
              <CalendarDays className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted text-sm">No hay eventos próximos.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {eventosPendientes.map(evento => {
                const colorMap: Record<string, string> = {
                  visita: 'text-brand-blue bg-brand-blue/10',
                  tarea: 'text-warning bg-warning/10',
                  incidencia: 'text-error bg-error/10',
                  hito: 'text-purple-400 bg-purple-400/10',
                  reunion: 'text-text-main bg-white/10',
                  entrega: 'text-success bg-success/10'
                };
                const dotColor = colorMap[evento.tipo] || 'text-text-muted bg-white/5';

                return (
                  <Link key={evento.id} href={`/calendario`} className="block">
                    <GlassCard interactive padding="p-4" className="flex items-center gap-4 group">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${dotColor}`}>
                        <span className="text-[10px] font-bold uppercase leading-none mb-1 opacity-80">{new Date(evento.fecha).toLocaleDateString('es', { month: 'short' })}</span>
                        <span className="text-lg font-bold leading-none">{new Date(evento.fecha).getDate()}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${dotColor}`}>
                            {evento.tipo}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-text-main truncate group-hover:text-brand-blue transition-colors">
                          {evento.titulo}
                        </h3>
                        <p className="text-xs text-text-muted truncate mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {evento.obra_nombre || 'General'}
                        </p>
                      </div>
                      
                      {evento.hora_inicio && (
                        <div className="text-xs font-semibold text-text-main bg-surface-2 px-2.5 py-1.5 rounded-lg border border-white/5">
                          {evento.hora_inicio.slice(0, 5)}
                        </div>
                      )}
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* PROJECTS LIST */}
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-blue" />
              Obras Recientes
            </h2>
            <Link href="/obras" className="text-xs font-semibold text-text-muted hover:text-brand-blue transition-colors flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          {obrasRecientes.length === 0 ? (
            <GlassCard className="text-center py-10">
              <Briefcase className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted text-sm">No hay obras registradas aún.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {obrasRecientes.map((obra) => (
                <Link key={obra.id} href={`/obras/${obra.id}`} className="block">
                  <GlassCard interactive padding="p-4" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-surface-2 to-surface border border-white/5 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-text-muted group-hover:text-brand-blue transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono text-text-muted">
                          {obra.codigo}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getEstadoColor(obra.estado)}`}>
                          {estadoObraLabels[obra.estado]}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-text-main group-hover:text-brand-blue transition-colors truncate mb-2">
                        {obra.nombre}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden flex-1 border border-white/5">
                          <div 
                            className="bg-brand-blue h-full rounded-full transition-all duration-500" 
                            style={{ width: `${obra.progreso_porcentaje ?? 0}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-brand-blue">{obra.progreso_porcentaje ?? 0}%</span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRESUPUESTOS ROW */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand-blue" />
            Gestión de Presupuestos
          </h2>
          
          <div className="flex items-center gap-4 relative z-50">
            <div className="w-48">
              <Dropdown 
                value={filtroPresupuesto}
                onChange={setFiltroPresupuesto}
                options={[
                  { value: 'todos', label: 'Todos los estados' },
                  ...Object.entries(estadoPresupuestoLabels).map(([val, label]) => ({ value: val, label }))
                ]}
              />
            </div>
            <Link href="/presupuestos" className="text-xs font-semibold text-text-muted hover:text-brand-blue transition-colors flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {presupuestos.filter(p => filtroPresupuesto === 'todos' || p.estado === filtroPresupuesto).length === 0 ? (
          <GlassCard className="text-center py-10">
            <Calculator className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
            <p className="text-text-muted text-sm">No hay presupuestos con este estado.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {presupuestos
              .filter(p => filtroPresupuesto === 'todos' || p.estado === filtroPresupuesto)
              .map(p => (
              <Link key={p.id} href={p.obra_id ? `/obras/${p.obra_id}/presupuestos/${p.id}` : `/presupuestos/${p.id}`} className="block h-full">
                <GlassCard interactive padding="p-4" className="h-full flex flex-col group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-brand-blue/70">{p.codigo || `PTO-${p.id}`}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      p.estado === 'aprobado' ? 'bg-success/10 text-success border-success/20' :
                      p.estado === 'enviado' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                      p.estado === 'borrador' ? 'bg-white/5 text-text-muted border-white/10' :
                      'bg-warning/10 text-warning border-warning/20'
                    }`}>
                      {estadoPresupuestoLabels[p.estado]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-text-main group-hover:text-brand-blue transition-colors mb-1 truncate">
                    {p.nombre}
                  </h3>
                  <div className="mt-auto pt-3 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Total</p>
                      <p className="font-bold text-text-main">{p.total.toLocaleString('es-ES')} €</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* TASKS ROW */}
      <div className="pt-6 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-blue" />
            Tareas Pendientes
          </h2>
          
          {tareasPendientes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="glass-panel px-3 py-1.5 rounded-full flex items-center">
                <span className="text-text-main font-bold mr-1">{tareasPendientes.length}</span> pendientes
              </div>
              <div className="bg-error/10 border border-error/20 px-3 py-1.5 rounded-full flex items-center">
                <AlertCircle className="w-3 h-3 text-error mr-1.5" />
                <span className="text-error font-bold mr-1">
                  {tareasPendientes.filter(t => t.estado === EstadoTarea.VENCIDA).length}
                </span> vencidas
              </div>
            </div>
          )}
        </div>
        
        {tareasPendientes.length === 0 ? (
          <GlassCard className="text-center py-10">
            <CheckCircle2 className="w-10 h-10 text-success/50 mx-auto mb-3" />
            <p className="text-text-muted text-sm">No hay tareas pendientes.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tareasPendientes.map(tarea => (
              <Link key={tarea.id} href={`/obras/${tarea.obra_id}`} className="block h-full">
                <GlassCard interactive padding="p-5" className="h-full flex flex-col group relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${tarea.estado === EstadoTarea.VENCIDA ? 'bg-error' : tarea.estado === EstadoTarea.EN_PROGRESO ? 'bg-brand-blue' : 'bg-warning'}`}></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-text-main text-sm line-clamp-2 pr-2 group-hover:text-brand-blue transition-colors">
                      {tarea.titulo}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                      tarea.estado === EstadoTarea.VENCIDA ? 'bg-error/20 text-error' :
                      tarea.estado === EstadoTarea.PENDIENTE ? 'bg-warning/20 text-warning' :
                      'bg-brand-blue/20 text-brand-blue'
                    }`}>
                      {tarea.estado === EstadoTarea.PENDIENTE ? 'Pendiente' : 
                       tarea.estado === EstadoTarea.VENCIDA ? 'Vencida' : 'En Progreso'}
                    </span>
                  </div>
                  
                  {tarea.descripcion && (
                    <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed">{tarea.descripcion}</p>
                  )}
                  
                  <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="flex items-center text-text-muted truncate pr-2">
                      <User className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      {tarea.responsable?.nombre || 'Sin asignar'}
                    </span>
                    {tarea.fecha_limite && (
                      <span className={`flex items-center font-medium ${tarea.estado === EstadoTarea.VENCIDA ? 'text-error' : 'text-text-main'}`}>
                        <Clock className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                        {new Date(tarea.fecha_limite).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
