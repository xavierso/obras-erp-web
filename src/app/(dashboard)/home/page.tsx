'use client';
import { useEffect, useState } from 'react';
import { dashboardApi, ResumenDashboard } from '@/lib/dashboardApi';
import { obrasApi, Obra, estadoObraLabels, EstadoObra } from '@/lib/obrasApi';
import { citasApi, CitaVisita } from '@/lib/citasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [obrasRecientes, setObrasRecientes] = useState<Obra[]>([]);
  const [citasPendientes, setCitasPendientes] = useState<CitaVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, obrasData, citasData] = await Promise.all([
          dashboardApi.obtenerResumen(),
          obrasApi.listar(),
          citasApi.listar({ estado: 'pendiente' as any })
        ]);
        setResumen(dashboardData);
        setObrasRecientes(obrasData.slice(0, 3));
        setCitasPendientes(citasData.slice(0, 5)); // Show up to 5 upcoming appointments
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
            <h2 className="text-xl font-bold text-text-main">Próximas Citas</h2>
            <Link href="/citas" className="text-sm text-accent hover:underline">Ver todas</Link>
          </div>
          
          {citasPendientes.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-text-muted text-sm">No hay citas pendientes.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {citasPendientes.map(cita => (
                <Link key={cita.id} href={`/citas/${cita.id}`} className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:border-accent transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-text-main text-sm truncate pr-2">
                      {cita.nombre_referencia || `Obra #${cita.obra_id}`}
                    </span>
                    <span className="text-xs font-semibold text-accent whitespace-nowrap bg-accent/10 px-2 py-1 rounded-md">
                      {new Date(cita.fecha_hora).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted flex justify-between items-center">
                    <span>{new Date(cita.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {cita.recordatorio_minutos_antes !== null && (
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {cita.recordatorio_minutos_antes}m
                      </span>
                    )}
                  </div>
                </Link>
              ))}
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
    </div>
  );
}
