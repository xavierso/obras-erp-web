'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obrasApi, Obra, EstadoObra, estadoObraLabels } from '@/lib/obrasApi';
import { visitasApi, Visita } from '@/lib/visitasApi';
import { citasApi, CitaVisita } from '@/lib/citasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { isUserLector, isUserAdmin, isUserDirector } from '@/lib/authApi';

export default function ObraDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [citas, setCitas] = useState<CitaVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const fetchObraData = async () => {
    try {
      const [obraData, visitasData, citasData] = await Promise.all([
        obrasApi.obtener(obraId),
        visitasApi.listar(obraId),
        citasApi.listar({ obra_id: obraId, estado: 'pendiente' as any })
      ]);
      setObra(obraData);
      setVisitas(visitasData);
      setCitas(citasData.filter(c => c.estado === 'pendiente' || c.estado === 'completada'));
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al cargar la obra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(obraId)) {
      fetchObraData();
    }
  }, [obraId]);

  const handleCambiarEstado = async (nuevoEstado: EstadoObra) => {
    if (!obra) return;
    setCambiandoEstado(true);
    try {
      const actualizada = await obrasApi.cambiarEstado(obraId, nuevoEstado);
      setObra(actualizada);
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Error al cambiar el estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-text-muted">Cargando...</div>;
  if (error || !obra) return <div className="text-error">{error || 'Obra no encontrada'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-text-muted hover:text-accent transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main">{obra.nombre}</h1>
            <p className="text-text-muted text-sm font-mono">{obra.codigo}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Detalles y Estado */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard padding="p-5">
            <h3 className="font-semibold text-text-main mb-4">Detalles</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-text-muted text-xs">Cliente</span>
                <span className="text-text-main">{obra.cliente || 'No especificado'}</span>
              </div>
              <div>
                <span className="block text-text-muted text-xs">Dirección</span>
                <span className="text-text-main">{obra.direccion || 'No especificada'}</span>
              </div>
              <div>
                <span className="block text-text-muted text-xs">Progreso</span>
                <span className="text-text-main">{obra.progreso_porcentaje ?? 0}%</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="p-5">
            <h3 className="font-semibold text-text-main mb-4">Estado Actual</h3>
            <div className="mb-4">
              <span className="text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg text-sm font-semibold">
                {estadoObraLabels[obra.estado]}
              </span>
            </div>
            
            <div className="space-y-2 mt-6">
              <p className="text-xs text-text-muted mb-2">Cambiar estado a:</p>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent disabled:opacity-50"
                value={obra.estado}
                disabled={cambiandoEstado || (!isUserAdmin(user) && !isUserDirector(user))}
                onChange={(e) => handleCambiarEstado(e.target.value as EstadoObra)}
              >
                {Object.entries(estadoObraLabels).map(([val, label]) => (
                  <option key={val} value={val} className="bg-bg-deep text-text-main">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </GlassCard>

          {/* Sección de Citas Programadas */}
          <GlassCard padding="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-text-main">Próximas Citas</h3>
              {!isUserLector(user) && (
                <Link href={`/citas/nuevo?obraId=${obra.id}`} className="text-xs text-accent hover:underline">Programar</Link>
              )}
            </div>
            
            {citas.length === 0 ? (
              <p className="text-xs text-text-muted">No hay citas programadas.</p>
            ) : (
              <div className="space-y-3">
                {citas.map(cita => (
                  <Link key={cita.id} href={`/citas/${cita.id}`} className="block p-3 bg-white/5 border border-white/10 rounded-xl hover:border-accent transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-text-main">
                        {new Date(cita.fecha_hora).toLocaleDateString()} {new Date(cita.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${cita.estado === 'pendiente' ? 'bg-accent' : cita.estado === 'completada' ? 'bg-success' : 'bg-error'}`} />
                    </div>
                    {cita.notas && <p className="text-xs text-text-muted line-clamp-1">{cita.notas}</p>}
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Columna Derecha: Visitas */}
        <div className="lg:col-span-2">
          <GlassCard padding="p-5" className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-text-main">Visitas ({visitas.length})</h3>
              {!isUserLector(user) && (
                <Link href={`/obras/${obra.id}/visitas/nuevo`}>
                  <Button className="!min-h-[40px] px-4 py-2 text-sm">Registrar Visita</Button>
                </Link>
              )}
            </div>

            {visitas.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm py-10">
                No hay visitas registradas para esta obra.
              </div>
            ) : (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {visitas.map(visita => (
                  <div key={visita.id} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-brand-blue/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="flex items-center text-xs font-semibold text-text-main bg-white/10 px-2.5 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(visita.fecha).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-text-muted flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {visita.archivos.length} archivos
                      </span>
                    </div>
                    {visita.descripcion && (
                      <p className="text-sm text-text-muted line-clamp-2 mb-3">{visita.descripcion}</p>
                    )}
                    <div className="flex justify-end border-t border-white/5 pt-2 mt-2">
                      <Link href={`/obras/${obraId}/visitas/${visita.id}`}>
                        <Button variant="outlined" className="!py-1 !px-3 text-xs">
                          Ver / Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
