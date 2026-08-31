'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obrasApi, Obra, EstadoObra, estadoObraLabels } from '@/lib/obrasApi';
import { visitasApi, Visita } from '@/lib/visitasApi';
import { citasApi, CitaVisita } from '@/lib/citasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import Link from 'next/link';

import { tareasApi, Tarea } from '@/lib/tareasApi';
import { ListaTareas } from '@/components/tareas/ListaTareas';
import { incidenciasApi, Incidencia } from '@/lib/incidenciasApi';
import { ListaIncidencias } from '@/components/incidencias/ListaIncidencias';

import { useAuth } from '@/context/AuthContext';
import { isUserLector, isUserAdmin, isUserDirector } from '@/lib/authApi';

import { ModalInformeObra } from '@/components/informes/ModalInformeObra';
import { documentosApi, Documento } from '@/lib/documentosApi';
import { ListaDocumentos } from '@/components/documentos/ListaDocumentos';
import { GaleriaVisitas } from '@/components/visitas/GaleriaVisitas';

export default function ObraDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [citas, setCitas] = useState<CitaVisita[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [modalInformeOpen, setModalInformeOpen] = useState(false);

  const fetchObraData = async () => {
    try {
      const [obraData, visitasData, citasData, tareasData, incidenciasData, documentosData] = await Promise.all([
        obrasApi.obtener(obraId),
        visitasApi.listar(obraId),
        citasApi.listar({ obra_id: obraId, estado: 'pendiente' as any }),
        tareasApi.listarPorObra(obraId),
        incidenciasApi.listarPorObra(obraId),
        documentosApi.listar(obraId)
      ]);
      setObra(obraData);
      setVisitas(visitasData);
      setCitas(citasData.filter(c => c.estado === 'pendiente' || c.estado === 'completada'));
      setTareas(tareasData);
      setIncidencias(incidenciasData);
      setDocumentos(documentosData);
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

  const handleEliminarObra = async () => {
    if (!obra) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la obra "${obra.nombre}"?\nSe borrarán todas sus visitas, tareas e incidencias.`)) return;
    
    try {
      await obrasApi.eliminar(obraId);
      router.replace('/obras');
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Error al eliminar la obra');
    }
  };

  if (loading) return <div className="text-center py-10 text-text-muted">Cargando...</div>;
  if (error || !obra) return <div className="text-error">{error || 'Obra no encontrada'}</div>;

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
            {isUserAdmin(user) && (
              <button onClick={handleEliminarObra} className="text-red-400 hover:text-red-500 transition-colors p-1" title="Eliminar Obra">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </h1>
          <p className="text-text-muted text-sm font-mono">{obra.codigo}</p>
        </div>
      </div>
      
      <div className="flex justify-end mt-2 md:mt-0 w-48 relative z-50">
        <Dropdown
          value={obra.estado}
          disabled={cambiandoEstado || (!isUserAdmin(user) && !isUserDirector(user))}
          onChange={(val) => handleCambiarEstado(val as EstadoObra)}
          fullWidth
          options={Object.entries(estadoObraLabels).map(([val, label]) => ({
            value: val,
            label: label
          }))}
        />
      </div>
    </div>

      {modalInformeOpen && (
        <ModalInformeObra 
          obraId={obra.id} 
          obraCodigo={obra.codigo} 
          onClose={() => setModalInformeOpen(false)} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ROW 1: Detalles (Izquierda) + Visitas (Derecha) */}
        <div className="lg:col-span-1 h-full">
          <GlassCard padding="p-5" className="h-full">
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
            
            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="font-semibold text-text-main mb-4 text-sm">Control Económico</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs">Ppto. Aprobado</span>
                  <span className="text-text-main font-semibold">
                    {obra.presupuesto_aprobado != null ? `${obra.presupuesto_aprobado.toLocaleString('es-ES')} €` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs">Coste Estimado</span>
                  <span className="text-text-main">
                    {obra.coste_estimado != null ? `${obra.coste_estimado.toLocaleString('es-ES')} €` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs">Margen Estimado</span>
                  <span className={`${obra.margen_estimado && obra.margen_estimado < 0 ? 'text-red-400' : 'text-green-400'} font-semibold`}>
                    {obra.margen_estimado != null ? `${obra.margen_estimado.toLocaleString('es-ES')} €` : '—'}
                  </span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-text-muted text-xs">Estado Ppto.</span>
                  <span className="text-accent text-xs font-semibold">
                    {obra.estado_presupuesto ? obra.estado_presupuesto.replace('_', ' ').toUpperCase() : 'NO ACTIVO'}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2 h-full">
          <GlassCard padding="p-5" className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-text-main">Visitas ({visitas.length})</h3>
              {!isUserLector(user) && (
                <Link href={`/obras/${obra.id}/visitas/nuevo`}>
                  <Button fullWidth={false} className="!min-h-[32px] px-3 py-1.5 text-xs">Registrar Visita</Button>
                </Link>
              )}
            </div>

            {visitas.length === 0 ? (
              <div className="flex items-center justify-center text-text-muted text-sm py-4">
                No hay visitas registradas para esta obra.
              </div>
            ) : (
              <div className="space-y-4 pr-2 max-h-[300px] overflow-y-auto custom-scrollbar">
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
                        <Button variant="outlined" className="!py-1 !px-3 text-xs">Ver / Editar</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* ROW 2: Módulos (Izquierda) + Tareas (Derecha) */}
        <div className="lg:col-span-1 h-full">
          <GlassCard padding="p-5" className="h-full">
            <h3 className="font-semibold text-text-main mb-4">Herramientas de Obra</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/obras/${obraId}/calendario`} className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-blue/50 rounded-xl transition-all group">
                <svg className="w-6 h-6 mb-2 text-text-muted group-hover:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-xs font-semibold text-text-main">Calendario</span>
              </Link>
              
              <Link href={`/obras/${obraId}/presupuestos`} className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-blue/50 rounded-xl transition-all group">
                <svg className="w-6 h-6 mb-2 text-text-muted group-hover:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <span className="text-xs font-semibold text-text-main">Presupuestos</span>
              </Link>

              <Link href={`/obras/${obraId}/cronograma`} className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-blue/50 rounded-xl transition-all group">
                <svg className="w-6 h-6 mb-2 text-text-muted group-hover:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="text-xs font-semibold text-text-main">Cronograma</span>
              </Link>

              <button onClick={() => setModalInformeOpen(true)} className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-blue/50 rounded-xl transition-all group">
                <svg className="w-6 h-6 mb-2 text-text-muted group-hover:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-xs font-semibold text-text-main text-center">Informe PDF</span>
              </button>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2 h-full">
          <GlassCard padding="p-5" className="h-full">
            <ListaTareas 
              obraId={obra.id} 
              tareas={tareas} 
              onRefresh={fetchObraData} 
            />
          </GlassCard>
        </div>

        {/* ROW 3: Próximas Citas (Izquierda) + Incidencias (Derecha) */}
        <div className="lg:col-span-1 h-full">
          <GlassCard padding="p-5" className="h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-text-main">Próximas Citas</h3>
              {!isUserLector(user) && (
                <Link href={`/citas/nuevo?obraId=${obra.id}`}>
                  <Button fullWidth={false} className="!min-h-[32px] px-3 py-1.5 text-xs">Programar</Button>
                </Link>
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

        <div className="lg:col-span-2 h-full">
          <GlassCard padding="p-5" className="h-full">
            <ListaIncidencias
              obraId={obra.id}
              incidencias={incidencias}
              onRefresh={fetchObraData}
            />
          </GlassCard>
        </div>

        {/* ROW 4: Galería Fotográfica */}
        <div className="lg:col-span-3 h-full">
          <GlassCard padding="p-5" className="h-full">
            <h3 className="font-semibold text-text-main mb-4">Galería Fotográfica</h3>
            <GaleriaVisitas visitas={visitas} />
          </GlassCard>
        </div>

        {/* ROW 5: Documentos */}
        <div className="lg:col-span-3 h-full">
          <GlassCard padding="p-5" className="h-full">
            <ListaDocumentos 
              obraId={obra.id}
              documentos={documentos}
              onRefresh={fetchObraData}
            />
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
