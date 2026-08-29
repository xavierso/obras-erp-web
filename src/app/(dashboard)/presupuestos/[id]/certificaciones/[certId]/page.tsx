'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { presupuestosApi, Presupuesto, CapituloPresupuesto } from '@/lib/presupuestosApi';
import { certificacionesApi, Certificacion, LineaCertificacion, estadoCertificacionLabels } from '@/lib/certificacionesApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { ArrowLeft, Save, FileText } from 'lucide-react';

export default function CertificacionEditorPage({ params }: { params: Promise<{ id: string, certId: string }> }) {
  const router = useRouter();
  const [presupuestoId, setPresupuestoId] = useState<number | null>(null);
  const [certId, setCertId] = useState<number | null>(null);
  
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [certificacion, setCertificacion] = useState<Certificacion | null>(null);
  const [lineas, setLineas] = useState<LineaCertificacion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(p => {
      setPresupuestoId(parseInt(p.id, 10));
      setCertId(parseInt(p.certId, 10));
    });
  }, [params]);

  useEffect(() => {
    if (presupuestoId && certId) {
      cargarDatos();
    }
  }, [presupuestoId, certId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ppto, cert] = await Promise.all([
        presupuestosApi.obtener(presupuestoId!),
        certificacionesApi.obtener(certId!)
      ]);
      setPresupuesto(ppto);
      setCertificacion(cert);
      setLineas(cert.lineas);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!certId) return;
    setSaving(true);
    try {
      const payload = lineas.map(l => ({
        partida_id: l.partida_id,
        cantidad_actual: l.cantidad_actual
      }));
      const updated = await certificacionesApi.guardarLineas(certId, payload);
      setCertificacion(updated);
      setLineas(updated.lineas);
      alert("Certificación guardada");
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCantidadChange = (partidaId: number, value: string) => {
    const num = parseFloat(value) || 0;
    setLineas(prev => prev.map(l => {
      if (l.partida_id === partidaId) {
        const cant = num;
        const impAct = cant * l.precio_unitario;
        const cantOrig = l.cantidad_anterior + cant;
        const impOrig = cantOrig * l.precio_unitario;
        const porc = l.cantidad_presupuesto > 0 ? (cantOrig / l.cantidad_presupuesto) * 100 : 0;
        return { 
          ...l, 
          cantidad_actual: cant,
          importe_actual: impAct,
          cantidad_origen: cantOrig,
          importe_origen: impOrig,
          porcentaje_avance: porc
        };
      }
      return l;
    }));
  };

  const handleChangeEstado = async (val: any) => {
    if (!certId) return;
    try {
      setSaving(true);
      const updated = await certificacionesApi.cambiarEstado(certId, val);
      setCertificacion(updated);
    } catch (e) {
      alert("Error al cambiar estado");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !certificacion || !presupuesto) return <div className="p-8 text-center text-text-muted">Cargando certificación...</div>;

  const isBorrador = certificacion.estado === 'borrador';
  
  // Agrupar líneas por capítulo para mostrarlas ordenadas visualmente igual que el presupuesto
  const renderCapitulo = (capitulo: CapituloPresupuesto, level: number = 0) => {
    // Buscar si hay líneas de este capítulo
    const partidasCapitulo = capitulo.partidas || [];
    
    return (
      <React.Fragment key={`cap-${capitulo.id}`}>
        {/* Cabecera del capítulo */}
        <tr className="bg-white/5 border-b border-white/5">
          <td colSpan={9} className="py-3 px-4 font-bold text-text-main" style={{ paddingLeft: `${(level + 1) * 16}px` }}>
            {capitulo.nombre}
          </td>
        </tr>
        
        {/* Partidas del capítulo */}
        {partidasCapitulo.map(partida => {
          const linea = lineas.find(l => l.partida_id === partida.id);
          if (!linea) return null;
          
          return (
            <tr key={`partida-${partida.id}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-2 px-4 text-xs font-mono text-text-muted">{linea.codigo_partida}</td>
              <td className="py-2 px-4 text-sm text-text-main">{linea.descripcion_partida}</td>
              <td className="py-2 px-4 text-xs text-text-muted text-center">{linea.unidad_partida}</td>
              <td className="py-2 px-4 text-xs text-right">{linea.precio_unitario.toLocaleString('es-ES')} €</td>
              
              <td className="py-2 px-4 text-xs text-right font-medium">{linea.cantidad_presupuesto.toLocaleString('es-ES')}</td>
              <td className="py-2 px-4 text-xs text-right text-brand-blue-light/70">{linea.cantidad_anterior.toLocaleString('es-ES')}</td>
              
              <td className="py-2 px-4 text-right">
                <input 
                  type="number"
                  step="0.01"
                  value={linea.cantidad_actual || ''}
                  onChange={(e) => handleCantidadChange(partida.id, e.target.value)}
                  disabled={!isBorrador}
                  className="w-20 bg-surface border border-white/20 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-brand-blue disabled:opacity-50"
                  placeholder="0.00"
                />
              </td>
              
              <td className="py-2 px-4 text-xs text-right font-bold text-brand-blue">{linea.cantidad_origen.toLocaleString('es-ES')}</td>
              <td className="py-2 px-4 text-xs text-right font-bold text-success">{linea.importe_actual.toLocaleString('es-ES')} €</td>
            </tr>
          );
        })}
        
        {/* Subcapitulos */}
        {capitulo.subcapitulos?.map(subcap => renderCapitulo(subcap, level + 1))}
      </React.Fragment>
    );
  };

  const totalActual = lineas.reduce((acc, l) => acc + (l.importe_actual || 0), 0);
  const totalOrigen = lineas.reduce((acc, l) => acc + (l.importe_origen || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main flex items-center gap-3">
              Certificación #{certificacion.numero}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Presupuesto: {presupuesto.codigo} - {presupuesto.nombre}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-50">
          <Dropdown
            value={certificacion.estado}
            options={[
              { value: 'borrador', label: 'Borrador' },
              { value: 'emitida', label: 'Emitida' },
              { value: 'facturada', label: 'Facturada' },
              { value: 'cobrada', label: 'Cobrada' },
              { value: 'anulada', label: 'Anulada' }
            ]}
            onChange={(val) => handleChangeEstado(val)}
            disabled={saving}
          />
          
          <Button 
            onClick={() => window.open(`/pdf/certificacion/${certId}`, '_blank')}
            variant="outlined" 
            className="text-text-main border-white/20 hover:bg-white/10 !min-h-0 h-[40px] py-0"
          >
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>

          {isBorrador && (
            <Button onClick={handleGuardar} disabled={saving} className="!min-h-0 h-[40px] py-0">
              <Save className="w-4 h-4 mr-2" /> Guardar
            </Button>
          )}
        </div>
      </div>

      <GlassCard padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-text-muted">
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Descripción</th>
                <th className="py-3 px-4 font-semibold text-center">Ud.</th>
                <th className="py-3 px-4 font-semibold text-right">P.U.</th>
                <th className="py-3 px-4 font-semibold text-right text-white">Med. Ppto</th>
                <th className="py-3 px-4 font-semibold text-right">Med. Anterior</th>
                <th className="py-3 px-4 font-semibold text-right text-brand-blue">Med. Actual</th>
                <th className="py-3 px-4 font-semibold text-right">Med. Origen</th>
                <th className="py-3 px-4 font-semibold text-right text-success">Importe Actual</th>
              </tr>
            </thead>
            <tbody>
              {presupuesto.capitulos.map(cap => renderCapitulo(cap, 0))}
            </tbody>
            <tfoot>
              <tr className="bg-white/10 border-t-2 border-white/20">
                <td colSpan={6} className="py-4 px-4 text-right font-bold text-text-main">
                  TOTALES CERTIFICACIÓN
                </td>
                <td colSpan={2} className="py-4 px-4 text-right font-bold text-text-muted">
                  A origen: {totalOrigen.toLocaleString('es-ES')} €
                </td>
                <td className="py-4 px-4 text-right font-bold text-success text-lg">
                  {totalActual.toLocaleString('es-ES')} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
