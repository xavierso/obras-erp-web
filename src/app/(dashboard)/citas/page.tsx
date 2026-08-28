'use client';
import { useEffect, useState } from 'react';
import { citasApi, CitaVisita, EstadoCita, estadoCitaLabels } from '@/lib/citasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function CitasPage() {
  const [citas, setCitas] = useState<CitaVisita[]>([]);
  const [obrasMap, setObrasMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { obrasApi } = await import('@/lib/obrasApi');
        const [citasData, obrasData] = await Promise.all([
          citasApi.listar(),
          obrasApi.listar()
        ]);
        setCitas(citasData);
        
        const map: Record<number, string> = {};
        obrasData.forEach(o => {
          map[o.id] = `${o.codigo} - ${o.nombre}`;
        });
        setObrasMap(map);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getEstadoColor = (estado: EstadoCita) => {
    switch (estado) {
      case EstadoCita.pendiente: return 'text-accent bg-accent/10 border-accent/20';
      case EstadoCita.completada: return 'text-success bg-success/10 border-success/20';
      case EstadoCita.cancelada: return 'text-error bg-error/10 border-error/20';
      default: return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Citas y Recordatorios</h1>
          <p className="text-text-muted text-sm">Gestiona tus próximas visitas</p>
        </div>
        <Link href="/citas/nuevo">
          <Button className="px-6">Programar Cita</Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-text-muted">Cargando citas...</div>
      ) : citas.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-text-muted mb-4">No tienes citas programadas</p>
          <Link href="/citas/nuevo">
            <Button variant="outlined" className="w-auto px-6">Programar la primera</Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {citas.map((cita) => (
            <Link key={cita.id} href={`/citas/${cita.id}`}>
              <GlassCard padding="p-5" className="hover:bg-surface/70 transition-colors h-full flex flex-col cursor-pointer group border-l-4" style={{
                borderLeftColor: cita.estado === EstadoCita.pendiente ? '#D4AF37' : cita.estado === EstadoCita.completada ? '#22c55e' : '#ef4444'
              }}>
                <div className="flex justify-between items-start mb-3">
                  <span className="flex items-center text-xs font-semibold text-text-main bg-white/10 px-2.5 py-1 rounded-md">
                    <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(cita.fecha_hora).toLocaleString()}
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getEstadoColor(cita.estado)}`}>
                    {estadoCitaLabels[cita.estado]}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-text-main mb-1 group-hover:text-accent transition-colors truncate">
                  {cita.nombre_referencia || (cita.obra_id ? obrasMap[cita.obra_id] || `Obra #${cita.obra_id}` : 'Cita')}
                </h3>
                
                {cita.notas && (
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">{cita.notas}</p>
                )}
                
                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center text-xs text-text-muted">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-accent opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>
                      {cita.recordatorio_minutos_antes !== null 
                        ? (cita.recordatorio_minutos_antes === 0 ? 'Al momento' : `${cita.recordatorio_minutos_antes} min antes`)
                        : 'Sin recordatorio'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
