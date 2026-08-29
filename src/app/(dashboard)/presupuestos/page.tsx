'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { presupuestosApi, PresupuestoResumen } from '@/lib/presupuestosApi';
import Link from 'next/link';

export default function PresupuestosGlobalPage() {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  const cargarPresupuestos = async () => {
    try {
      const data = await presupuestosApi.listarTodos();
      setPresupuestos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async () => {
    if (!nuevoNombre.trim()) return;
    try {
      setCreando(true);
      const nuevo = await presupuestosApi.crear({
        nombre: nuevoNombre,
        obra_id: null as any,
        descripcion: "",
        iva: 21,
        es_version_activa: true,
        capitulos: []
      } as any);
      window.location.href = `/presupuestos/${nuevo.id}`;
    } catch (e) {
      alert("Error al crear presupuesto");
      setCreando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main">Todos los Presupuestos</h1>
        <Button onClick={() => { setNuevoNombre(''); setShowModal(true); }}>Crear Presupuesto (Estudio)</Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard padding="p-6" className="w-full max-w-md animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Nuevo Presupuesto</h2>
            <p className="text-sm text-text-muted mb-4">Introduce el nombre descriptivo para este nuevo presupuesto de estudio.</p>
            <div className="mb-6">
              <input 
                type="text" 
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                autoFocus
                placeholder="Ej. Reforma Integral Vivienda A"
                className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue outline-none" 
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setShowModal(false)} disabled={creando}>Cancelar</Button>
              <Button variant="primary" onClick={handleCrear} disabled={creando || !nuevoNombre.trim()}>
                {creando ? 'Creando...' : 'Crear Presupuesto'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {loading ? (
        <p>Cargando presupuestos...</p>
      ) : presupuestos.length === 0 ? (
        <GlassCard padding="p-8" className="text-center text-text-muted">
          No hay presupuestos en el sistema.
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presupuestos.map(p => (
            <Link key={p.id} href={`/presupuestos/${p.id}`}>
              <GlassCard interactive className="cursor-pointer h-full border border-white/5 relative flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {p.codigo && <span className="text-brand-blue font-mono text-sm mr-2">{p.codigo}</span>}
                    {p.nombre}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    p.estado === 'aprobado' ? 'bg-success/20 text-success' :
                    p.estado === 'borrador' ? 'bg-white/10 text-text-muted' :
                    p.estado === 'en_ejecucion' ? 'bg-brand-blue/20 text-brand-blue' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {p.estado.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-text-muted mb-4">
                  {p.obra_id ? `Obra #${p.obra_id}` : 'Sin obra asignada (En Estudio)'}
                </div>
                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-end">
                  <span className="text-xs text-text-muted">Total (con IVA)</span>
                  <span className="font-bold text-xl text-text-main">
                    {p.total != null ? p.total.toLocaleString('es-ES') : '0'} €
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
