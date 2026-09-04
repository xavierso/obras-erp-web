'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { presupuestosApi, PresupuestoResumen, estadoPresupuestoLabels } from '@/lib/presupuestosApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function PresupuestosPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!isNaN(obraId)) {
      Promise.all([
        obrasApi.obtener(obraId),
        presupuestosApi.listarPorObra(obraId)
      ])
      .then(([obraData, presupuestosData]) => {
        setObra(obraData);
        setPresupuestos(presupuestosData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error al cargar los presupuestos');
        setLoading(false);
      });
    }
  }, [obraId]);

  const handleCrearAnexo = async () => {
    if (!nuevoNombre.trim()) return;
    try {
      setCreando(true);
      const nuevo = await presupuestosApi.crear({
        nombre: nuevoNombre,
        obra_id: obraId,
        version: presupuestos.length + 1,
        estado: 'borrador',
        descripcion: "Generado como versión/anexo",
        iva: 21,
        es_version_activa: false, 
        capitulos: []
      });
      router.push(`/presupuestos/${nuevo.id}`);
    } catch (e) {
      console.error(e);
      alert("Error al crear presupuesto anexo");
      setCreando(false);
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
              <span>Presupuestos de {obra.nombre}</span>
            </h1>
          </div>
        </div>
        
        <Button onClick={() => { setNuevoNombre(`${obra.nombre} - Anexo/v${presupuestos.length + 1}`); setShowModal(true); }} fullWidth={false} className="!min-h-[40px] px-5 py-2">
          + Nuevo Presupuesto
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard padding="p-6" className="w-full max-w-md animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Nuevo Presupuesto / Anexo</h2>
            <p className="text-sm text-text-muted mb-4">Introduce el nombre de esta nueva versión o anexo para la obra.</p>
            <div className="mb-6">
              <input 
                type="text" 
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                autoFocus
                className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue outline-none" 
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setShowModal(false)} disabled={creando}>Cancelar</Button>
              <Button variant="primary" onClick={handleCrearAnexo} disabled={creando || !nuevoNombre.trim()}>
                {creando ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      <GlassCard padding="p-0" className="overflow-hidden">
        {presupuestos.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p>No hay presupuestos para esta obra.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase">Nombre / Versión</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase">Fecha</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase text-right">Coste Directo</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase text-right">Total (con IVA)</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase text-center">Estado</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {presupuestos.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-text-main flex items-center space-x-2">
                        <span>{p.nombre}</span>
                        {p.es_version_activa && (
                          <span className="bg-brand-blue/20 text-brand-blue text-[10px] px-2 py-0.5 rounded-full border border-brand-blue/30 font-bold tracking-wide">ACTIVA</span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">v{p.version}</div>
                    </td>
                    <td className="p-4 text-sm text-text-main">{new Date(p.fecha).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-text-main text-right font-mono">{p.coste_directo.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
                    <td className="p-4 text-sm text-text-main text-right font-mono font-semibold">{p.total.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold
                        ${p.estado === 'aprobado' || p.estado === 'en_ejecucion' ? 'bg-success/20 text-success' : ''}
                        ${p.estado === 'borrador' ? 'bg-white/10 text-text-muted' : ''}
                        ${p.estado === 'pendiente_aprobacion' ? 'bg-accent/20 text-accent' : ''}
                      `}>
                        {estadoPresupuestoLabels[p.estado].toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/presupuestos/${p.id}`}>
                        <Button variant="outlined" fullWidth={false} className="!py-1.5 !px-3 text-xs">Ver detalle / Editar</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
