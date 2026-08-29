'use client';
import { useEffect, useState } from 'react';
import { obrasApi, Obra, estadoObraLabels, EstadoObra } from '@/lib/obrasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { isUserAdmin, isUserDirector } from '@/lib/authApi';

export default function ObrasPage() {
  const { user } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const data = await obrasApi.listar();
        setObras(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al cargar las obras');
      } finally {
        setLoading(false);
      }
    };
    fetchObras();
  }, []);

  const getEstadoColor = (estado: EstadoObra) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Mis Obras</h1>
          <p className="text-text-muted text-sm">Gestiona tus proyectos activos</p>
        </div>
        {(isUserAdmin(user) || isUserDirector(user)) && (
          <Link href="/obras/nuevo">
            <Button className="px-6">Nueva Obra</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-text-muted">Cargando obras...</div>
      ) : obras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 mt-8">
          <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">Aún no tienes obras registradas</h2>
          <p className="text-text-muted mb-8 max-w-md">
            Comienza creando tu primer proyecto para empezar a gestionar visitas, tareas, incidencias y documentación.
          </p>
          {(isUserAdmin(user) || isUserDirector(user)) && (
            <Link href="/obras/nuevo">
              <Button className="px-8 shadow-lg shadow-brand-blue/20">
                + Crear mi primera obra
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((obra) => (
            <Link key={obra.id} href={`/obras/${obra.id}`}>
              <GlassCard padding="p-5" className="hover:bg-surface/70 transition-colors h-full flex flex-col cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <span className="flex items-center text-xs font-mono text-text-muted bg-white/10 px-2.5 py-1 rounded-md">
                    <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {obra.codigo}
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getEstadoColor(obra.estado)}`}>
                    {estadoObraLabels[obra.estado]}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-text-main mb-1 group-hover:text-accent transition-colors">
                  {obra.nombre}
                </h3>
                {obra.cliente && (
                  <p className="text-sm text-text-muted mb-4 line-clamp-1">{obra.cliente}</p>
                )}
                
                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center text-xs text-text-muted">
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-main">{obra.total_visitas}</span>
                    <span>Visitas</span>
                  </div>
                  <div className="flex flex-col items-end w-[40%]">
                    <div className="flex justify-between w-full mb-1">
                      <span>Avance</span>
                      <span className="font-bold text-brand-blue">{obra.progreso_porcentaje ?? 0}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                      <div 
                        className="bg-brand-blue h-full rounded-full transition-all duration-500" 
                        style={{ width: `${obra.progreso_porcentaje ?? 0}%` }}
                      ></div>
                    </div>
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
