'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { presupuestosApi, Presupuesto, estadoPresupuestoLabels } from '@/lib/presupuestosApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function PresupuestoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  const presupuestoId = parseInt(params.presupuestoId as string, 10);
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [aprobarLoading, setAprobarLoading] = useState(false);
  const [generarCronoLoading, setGenerarCronoLoading] = useState(false);

  useEffect(() => {
    if (!isNaN(obraId) && !isNaN(presupuestoId)) {
      Promise.all([
        obrasApi.obtener(obraId),
        presupuestosApi.obtener(presupuestoId)
      ])
      .then(([obraData, presupuestoData]) => {
        setObra(obraData);
        setPresupuesto(presupuestoData);
      })
      .catch(err => setError(err.message || 'Error al cargar el presupuesto'))
      .finally(() => setLoading(false));
    }
  }, [obraId, presupuestoId]);

  const handleAprobar = async () => {
    if (!confirm("¿Confirmar aprobación del presupuesto?\nEsta acción lo marcará como la versión activa de la obra.")) return;
    setAprobarLoading(true);
    try {
      const pptoAprobado = await presupuestosApi.aprobar(presupuestoId);
      setPresupuesto(pptoAprobado);
      alert("Presupuesto aprobado correctamente.");
    } catch (err: any) {
      alert(err.message || 'Error al aprobar presupuesto');
    } finally {
      setAprobarLoading(false);
    }
  };

  const handleGenerarCronograma = async () => {
    if (!presupuesto) return;
    // Seleccionar todas las partidas por defecto en esta fase
    const todasLasPartidas = presupuesto.capitulos.flatMap(c => c.partidas.map(p => p.id));
    if (todasLasPartidas.length === 0) {
      alert("No hay partidas para enviar al cronograma");
      return;
    }
    if (!confirm(`¿Convertir ${todasLasPartidas.length} partidas en actividades del cronograma?`)) return;
    
    setGenerarCronoLoading(true);
    try {
      const result = await presupuestosApi.generarCronograma(presupuestoId, todasLasPartidas);
      alert(result.message);
      router.push(`/obras/${obraId}/cronograma`);
    } catch (err: any) {
      alert(err.message || 'Error al generar cronograma');
    } finally {
      setGenerarCronoLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-text-muted">Cargando...</div>;
  if (error || !obra || !presupuesto) return <div className="text-error">{error || 'No encontrado'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start md:items-center space-x-4">
          <button onClick={() => router.push(`/obras/${obraId}/presupuestos`)} className="text-text-muted hover:text-accent transition-colors mt-1 md:mt-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main flex items-center space-x-3">
              <span>{presupuesto.nombre}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold
                  ${presupuesto.estado === 'aprobado' || presupuesto.estado === 'en_ejecucion' ? 'bg-success/20 text-success' : ''}
                  ${presupuesto.estado === 'borrador' ? 'bg-white/10 text-text-muted' : ''}
                  ${presupuesto.estado === 'pendiente_aprobacion' ? 'bg-accent/20 text-accent' : ''}
                `}>
                  {estadoPresupuestoLabels[presupuesto.estado].toUpperCase()}
              </span>
            </h1>
            <p className="text-sm text-text-muted flex items-center space-x-4 mt-1">
              <span>v{presupuesto.version}</span>
              <span>•</span>
              <span>{new Date(presupuesto.fecha).toLocaleDateString()}</span>
              {presupuesto.es_version_activa && (
                <>
                  <span>•</span>
                  <span className="text-brand-blue font-bold">VERSIÓN ACTIVA</span>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {(presupuesto.estado === 'borrador' || presupuesto.estado === 'pendiente_aprobacion') && (
            <Button onClick={handleAprobar} disabled={aprobarLoading} fullWidth={false} className="!min-h-[40px] px-5 py-2">
              Aprobar Presupuesto
            </Button>
          )}
          {(presupuesto.estado === 'aprobado' || presupuesto.estado === 'en_ejecucion') && (
            <Button onClick={handleGenerarCronograma} disabled={generarCronoLoading} fullWidth={false} className="!min-h-[40px] px-5 py-2 bg-purple-600 hover:bg-purple-700">
              Generar Cronograma
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {presupuesto.capitulos.map(capitulo => (
            <GlassCard key={capitulo.id} padding="p-0" className="overflow-hidden">
              <div className="p-4 bg-white/[0.03] border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-text-main text-lg">{capitulo.nombre}</h3>
                <span className="font-mono font-semibold text-text-main">{capitulo.subtotal.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="p-3 text-xs font-semibold text-text-muted w-20">CÓDIGO</th>
                      <th className="p-3 text-xs font-semibold text-text-muted">PARTIDA</th>
                      <th className="p-3 text-xs font-semibold text-text-muted text-center w-20">UD</th>
                      <th className="p-3 text-xs font-semibold text-text-muted text-right w-24">CANT.</th>
                      <th className="p-3 text-xs font-semibold text-text-muted text-right w-32">PRECIO</th>
                      <th className="p-3 text-xs font-semibold text-text-muted text-right w-36">IMPORTE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {capitulo.partidas.map(partida => (
                      <tr key={partida.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono text-text-muted">{partida.codigo}</td>
                        <td className="p-3 text-text-main font-medium">{partida.descripcion}</td>
                        <td className="p-3 text-text-muted text-center">{partida.unidad}</td>
                        <td className="p-3 text-text-main text-right font-mono">{partida.cantidad}</td>
                        <td className="p-3 text-text-main text-right font-mono">{partida.precio_unitario.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
                        <td className="p-3 text-text-main text-right font-mono font-semibold">{partida.importe.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <GlassCard padding="p-5">
              <h3 className="font-semibold text-text-main mb-4 border-b border-white/10 pb-2">RESUMEN ECONÓMICO</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">Coste Directo</span>
                  <span className="font-mono text-text-main">{presupuesto.coste_directo.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted">IVA ({presupuesto.iva}%)</span>
                  <span className="font-mono text-text-main">{presupuesto.importe_iva.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                </div>
                <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold text-text-main">TOTAL</span>
                  <span className="font-mono font-bold text-text-main text-lg">{presupuesto.total.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                </div>
                
                {presupuesto.coste_estimado_obra !== undefined && presupuesto.coste_estimado_obra !== null && (
                  <div className="mt-6 pt-6 border-t border-dashed border-white/20">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-text-muted">Coste Estimado Obra</span>
                      <span className="font-mono text-text-main">{presupuesto.coste_estimado_obra.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-muted font-bold">Margen Estimado</span>
                      <span className={`font-mono font-bold ${(presupuesto.total - presupuesto.coste_estimado_obra) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {(presupuesto.total - presupuesto.coste_estimado_obra).toLocaleString('es-ES', {minimumFractionDigits: 2})} €
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
            
            {presupuesto.observaciones && (
              <GlassCard padding="p-5" className="mt-6">
                <h4 className="text-sm font-semibold text-text-main mb-2">Observaciones</h4>
                <p className="text-sm text-text-muted whitespace-pre-wrap">{presupuesto.observaciones}</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
