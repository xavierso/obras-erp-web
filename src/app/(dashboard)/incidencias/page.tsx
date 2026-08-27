'use client';
import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { incidenciasApi, Incidencia } from '@/lib/incidenciasApi';
import { ListaIncidencias } from '@/components/incidencias/ListaIncidencias';
import Link from 'next/link';

export default function IncidenciasGlobalPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [obrasData, incidenciasData] = await Promise.all([
        obrasApi.listar(),
        incidenciasApi.listar()
      ]);
      setObras(obrasData);
      setIncidencias(incidenciasData);
    } catch (error) {
      console.error('Error al cargar datos de incidencias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'NUEVA': return '#3b82f6';
      case 'EN_PROCESO': return '#f59e0b';
      case 'RESUELTA': return '#22c55e';
      case 'CERRADA': return '#9ca3af';
      default: return '#3b82f6';
    }
  };
  
  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'NUEVA': return 'Nueva';
      case 'EN_PROCESO': return 'En Proceso';
      case 'RESUELTA': return 'Resuelta';
      case 'CERRADA': return 'Cerrada';
      default: return estado;
    }
  };
  
  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case 'NUEVA': return 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
      case 'EN_PROCESO': return 'text-warning bg-warning/10 border-warning/20';
      case 'RESUELTA': return 'text-success bg-success/10 border-success/20';
      case 'CERRADA': return 'text-text-muted bg-white/10 border-white/20';
      default: return 'text-text-muted bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Incidencias Globales</h1>
          <p className="text-text-muted text-sm mt-1">Aquí puedes ver todas las incidencias de todas las obras.</p>
        </div>
        <Button variant="outlined" onClick={cargarDatos} fullWidth={false} className="px-6">
          Actualizar
        </Button>
      </div>

      {incidencias.length === 0 ? (
        <GlassCard className="text-center py-12">
          <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-bold text-text-main mb-2">Sin incidencias registradas</h3>
          <p className="text-text-muted max-w-md mx-auto">
            No hay incidencias reportadas en ninguna de tus obras actualmente. ¡Excelente trabajo!
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidencias.map(incidencia => {
            const obra = obras.find(o => o.id === incidencia.obra_id);
            return (
              <a key={incidencia.id} href={`/obras/${incidencia.obra_id}`} className="block h-full">
                <GlassCard padding="p-5" className="hover:bg-surface/70 transition-colors h-full flex flex-col cursor-pointer group border-l-4" style={{
                  borderLeftColor: getEstadoColor(incidencia.estado)
                }}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="flex items-center text-xs font-semibold text-text-main bg-white/10 px-2.5 py-1 rounded-md">
                      <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(incidencia.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getEstadoClasses(incidencia.estado)}`}>
                      {getEstadoLabel(incidencia.estado)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-mono bg-white/10 text-text-muted px-1.5 py-0.5 rounded">
                      {incidencia.codigo}
                    </span>
                    <h3 className="font-bold text-lg text-text-main group-hover:text-accent transition-colors line-clamp-1">
                      {incidencia.titulo}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">
                    {obra ? `${obra.codigo} - ${obra.nombre}` : `Obra #${incidencia.obra_id}`}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center text-xs text-text-muted">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-accent opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate max-w-[120px]">
                        {incidencia.responsable?.nombre || 'Sin asignar'}
                      </span>
                    </div>
                    {incidencia.fecha_limite && (
                      <span className="text-error/90 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(incidencia.fecha_limite).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </GlassCard>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
