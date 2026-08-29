'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { presupuestosApi, Presupuesto } from '@/lib/presupuestosApi';
import { certificacionesApi, CertificacionResumen, estadoCertificacionLabels } from '@/lib/certificacionesApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CertificacionesListPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [presupuestoId, setPresupuestoId] = useState<number | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [certificaciones, setCertificaciones] = useState<CertificacionResumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => {
      const id = parseInt(p.id, 10);
      if (!isNaN(id)) {
        setPresupuestoId(id);
      }
    });
  }, [params]);

  useEffect(() => {
    if (presupuestoId) {
      cargarDatos();
    }
  }, [presupuestoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pptoData, certsData] = await Promise.all([
        presupuestosApi.obtener(presupuestoId!),
        certificacionesApi.listarPorPresupuesto(presupuestoId!)
      ]);
      setPresupuesto(pptoData);
      setCertificaciones(certsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCertificacion = async () => {
    if (!presupuestoId) return;
    try {
      const nueva = await certificacionesApi.crear(presupuestoId, {
        fecha: new Date().toISOString().split('T')[0]
      });
      router.push(`/presupuestos/${presupuestoId}/certificaciones/${nueva.id}`);
    } catch (error) {
      alert("Error al crear certificación");
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Cargando certificaciones...</div>;
  if (!presupuesto) return <div className="p-8 text-center text-error">Presupuesto no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main flex items-center gap-3">
              Certificaciones
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Presupuesto: {presupuesto.codigo} - {presupuesto.nombre}
            </p>
          </div>
        </div>
        
        <Button onClick={handleCrearCertificacion} className="!min-h-0 h-[40px]">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Certificación
        </Button>
      </div>

      {certificaciones.length === 0 ? (
        <GlassCard className="text-center py-16">
          <FileText className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-main mb-2">No hay certificaciones</h3>
          <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
            Las certificaciones te permiten medir el avance de las partidas del presupuesto y generar un documento de cobro o facturación mensual.
          </p>
          <Button onClick={handleCrearCertificacion} variant="outlined">
            Crear la primera Certificación
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificaciones.map((cert) => (
            <Link key={cert.id} href={`/presupuestos/${presupuestoId}/certificaciones/${cert.id}`}>
              <GlassCard interactive padding="p-5" className="h-full group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-semibold text-brand-blue uppercase tracking-wider">
                    Certificación #{cert.numero}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    cert.estado === 'borrador' ? 'bg-white/5 text-text-muted border-white/10' :
                    cert.estado === 'emitida' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                    cert.estado === 'facturada' || cert.estado === 'cobrada' ? 'bg-success/10 text-success border-success/20' :
                    'bg-error/10 text-error border-error/20'
                  }`}>
                    {estadoCertificacionLabels[cert.estado]}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase">Fecha de emisión</p>
                    <p className="text-sm text-text-main font-medium">{new Date(cert.fecha).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase">Importe Certificado (Sin IVA)</p>
                    <p className="text-lg text-text-main font-bold">{cert.importe_actual.toLocaleString('es-ES')} €</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-brand-blue group-hover:text-brand-blue-light">
                  <span className="text-xs font-semibold">Ver detalles</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
