'use client';
import { useEffect, useState } from 'react';
import { dashboardApi, ResumenDashboard } from '@/lib/dashboardApi';
import { obrasApi, Obra, estadoObraLabels, EstadoObra } from '@/lib/obrasApi';
import { citasApi, CitaVisita } from '@/lib/citasApi';
import { tareasApi, Tarea, EstadoTarea } from '@/lib/tareasApi';
import { calendarioApi, EventoCalendarioOut } from '@/lib/calendarioApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [obrasRecientes, setObrasRecientes] = useState<Obra[]>([]);
  const [eventosPendientes, setEventosPendientes] = useState<EventoCalendarioOut[]>([]);
  const [tareasPendientes, setTareasPendientes] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, obrasData, eventosData, tareasData] = await Promise.all([
          dashboardApi.obtenerResumen(),
          obrasApi.listar(),
          calendarioApi.listar({ fecha_inicio: new Date().toISOString().split('T')[0] }),
          tareasApi.listar({ limit: 5 })
        ]);
        setResumen(dashboardData);
        setObrasRecientes(obrasData.slice(0, 3));
        
        // Take up to 5 upcoming events, filtering out completed visits
        const upcoming = eventosData
          .filter(e => e.estado !== 'completada' && e.estado !== 'completado')
          .slice(0, 5);
          
        setEventosPendientes(upcoming);
        setTareasPendientes(tareasData.filter(t => t.estado !== EstadoTarea.COMPLETADA).slice(0, 5));
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
      case EstadoObra.enEjecucion: return 'text-accent bg-accent/10 border-accent/20';
      case EstadoObra.finalizada:
      case EstadoObra.entregada: return 'text-success bg-success/10 border-success/20';
      case EstadoObra.enPausa:
      case EstadoObra.archivada: return 'text-accent-muted bg-accent-muted/10 border-accent-muted/20';
      default: return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  if (loading) return <div className="text-center py-10 text-text-muted">Cargando inicio...</div>;
  if (error) return <div className="text-error p-4">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Hola, {user?.nombre || 'Inspector'}</h1>
        <p className="text-text-muted text-sm">Este es el resumen de tu empresa hoy</p>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard padding="p-4" className="text-center">
            <p className="text-3xl font-bold text-text-main mb-1">{resumen.obras_activas}</p>
            <p className="text-xs text-text-muted">Obras Activas</p>
          </GlassCard>
          <GlassCard padding="p-4" className="text-center">
            <p className="text-3xl font-bold text-brand-blue mb-1">{resumen.visitas_hoy}</p>
            <p className="text-xs text-text-muted">Visitas Hoy</p>
          </GlassCard>
          <GlassCard padding="p-4" className="text-center">
            <p className="text-3xl font-bold text-accent mb-1">{resumen.visitas_semana}</p>
            <p className="text-xs text-text-muted">Visitas Semana</p>
          </GlassCard>
          <GlassCard padding="p-4" className="text-center">
            <p className="text-3xl font-bold text-success mb-1">{resumen.documentos_nuevos_semana}</p>
            <p className="text-xs text-text-muted">Docs (7 días)</p>
          </GlassCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-text-main">Próximos Eventos</h2>
            <Link href="/calendario" className="text-sm text-accent hover:underline">Ver Calendario →</Link>
          </div>
          
          {eventosPendientes.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-text-muted text-sm">No hay eventos próximos.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {eventosPendientes.map(evento => {
                const colorMap: Record<string, string> = {
                  visita: 'bg-brand-blue text-white',
                  tarea: 'bg-yellow-500 text-black',
                  incidencia: 'bg-error text-white',
                  hito: 'bg-purple-500 text-white',
                  reunion: 'bg-gray-200 text-gray-800',
                  entrega: 'bg-green-500 text-white'
                };
                const dotColor = colorMap[evento.tipo] || 'bg-white/40 text-white';

                return (
                  <Link key={evento.id} href={`/calendario`} className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:border-accent transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-text-main text-sm flex items-center pr-2 line-clamp-1">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold mr-2 ${dotColor}`}>
                          {evento.tipo}
                        </span>
                        {evento.titulo}
                      </span>
                      <span className="text-xs font-semibold text-accent whitespace-nowrap bg-accent/10 px-2 py-1 rounded-md">
                        {new Date(evento.fecha).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-2 flex justify-between items-center">
                      <span className="truncate">{evento.obra_nombre || 'General'}</span>
                      {evento.hora_inicio && <span>{evento.hora_inicio.slice(0, 5)}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-text-main">Obras Recientes</h2>
            <Link href="/obras" className="text-sm text-accent hover:underline">Ver todas</Link>
          </div>
          
          {obrasRecientes.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-text-muted text-sm">No hay obras registradas aún.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {obrasRecientes.map((obra) => (
                <Link key={obra.id} href={`/obras/${obra.id}`} className="block">
                  <GlassCard padding="p-4" className="hover:bg-surface/70 transition-colors h-full flex flex-col cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="flex items-center text-xs font-mono text-text-muted bg-white/10 px-2.5 py-1 rounded-md">
                        {obra.codigo}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getEstadoColor(obra.estado)}`}>
                        {estadoObraLabels[obra.estado]}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-text-main group-hover:text-accent transition-colors truncate">
                      {obra.nombre}
                    </h3>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold text-text-main">Tareas Pendientes</h2>
          
          {tareasPendientes.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center">
                <span className="text-text-main font-semibold mr-1">{tareasPendientes.length}</span> pendientes
              </div>
              <div className="bg-error/10 border border-error/20 rounded-full px-3 py-1 flex items-center">
                <span className="text-error font-semibold mr-1">
                  {tareasPendientes.filter(t => t.estado === EstadoTarea.VENCIDA).length}
                </span> vencidas
              </div>
              <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-full px-3 py-1 flex items-center">
                <span className="text-brand-blue font-semibold mr-1">
                  {tareasPendientes.filter(t => {
                    if (!t.fecha_limite) return false;
                    const date = new Date(t.fecha_limite);
                    const now = new Date();
                    const endOfWeek = new Date(now);
                    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
                    return date >= now && date <= endOfWeek;
                  }).length}
                </span> para esta semana
              </div>
              <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center">
                <span className="text-text-muted font-semibold mr-1">
                  {tareasPendientes.filter(t => !t.fecha_limite).length}
                </span> sin fecha
              </div>
            </div>
          )}
        </div>
        
        {tareasPendientes.length === 0 ? (
          <GlassCard className="text-center py-8">
            <p className="text-text-muted text-sm">No hay tareas pendientes.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tareasPendientes.map(tarea => (
              <Link key={tarea.id} href={`/obras/${tarea.obra_id}`} className="block h-full">
                <GlassCard padding="p-4" className="hover:bg-surface/70 transition-colors h-full flex flex-col cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-text-main text-sm line-clamp-2 group-hover:text-accent transition-colors">{tarea.titulo}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      tarea.estado === EstadoTarea.PENDIENTE ? 'text-text-muted bg-white/5 border-white/10' :
                      'text-brand-blue bg-brand-blue/10 border-brand-blue/30'
                    }`}>
                      {tarea.estado === EstadoTarea.PENDIENTE ? 'Pendiente' : 'En Progreso'}
                    </span>
                  </div>
                  {tarea.descripcion && (
                    <p className="text-xs text-text-muted line-clamp-1 mb-2">{tarea.descripcion}</p>
                  )}
                  <div className="text-xs text-text-muted mt-auto pt-2 flex justify-between items-center">
                    <span className="truncate pr-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {tarea.responsable?.nombre || 'Sin asignar'}
                    </span>
                    {tarea.fecha_limite && (
                      <span className="whitespace-nowrap text-error/80">
                        Vence: {new Date(tarea.fecha_limite).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
