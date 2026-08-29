'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { presupuestosApi, Presupuesto, CapituloPresupuesto, PartidaPresupuesto } from '@/lib/presupuestosApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { ArrowLeft, Save, Plus, Check, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export default function PresupuestoEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const presupuestoId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { user } = useAuth();
  
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado local para edición interactiva
  const [capitulosLocales, setCapitulosLocales] = useState<CapituloPresupuesto[]>([]);
  const [expandedPartidas, setExpandedPartidas] = useState<Set<number>>(new Set());
  
  // Modal de crear obra
  const [showAprobarModal, setShowAprobarModal] = useState(false);
  const [obraNombre, setObraNombre] = useState('');
  const [obraDireccion, setObraDireccion] = useState('');

  useEffect(() => {
    cargarPresupuesto();
  }, [presupuestoId]);

  const cargarPresupuesto = async () => {
    try {
      const data = await presupuestosApi.obtener(presupuestoId);
      setPresupuesto(data);
      setCapitulosLocales(data.capitulos || []);
      if (data) setObraNombre(`Obra: ${data.nombre}`);
    } catch (error) {
      console.error('Error al cargar presupuesto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    if (nuevoEstado === 'aprobado' && !presupuesto?.obra_id) {
      setShowAprobarModal(true);
      return;
    }
    if (nuevoEstado === 'cancelado') {
      if (!confirm('¿Estás seguro de descartar este presupuesto? Si tiene actividades en el cronograma, se eliminarán automáticamente.')) return;
    }
    
    try {
      setSaving(true);
      if (nuevoEstado === 'aprobado') {
        await presupuestosApi.aprobar(presupuestoId);
      } else {
        await presupuestosApi.cambiarEstado(presupuestoId, nuevoEstado as any);
      }
      await cargarPresupuesto();
    } catch (e) {
      alert("Error al cambiar estado");
    } finally {
      setSaving(false);
    }
  };

  const handleAprobar = async () => {
    try {
      if (presupuesto?.obra_id) {
        await presupuestosApi.aprobar(presupuesto.id);
      } else {
        await presupuestosApi.aprobar(presupuesto!.id, { obra_nombre: obraNombre, obra_direccion: obraDireccion });
      }
      setShowAprobarModal(false);
      cargarPresupuesto();
      alert("Presupuesto aprobado con éxito.");
    } catch (e) {
      alert("Error al aprobar");
    }
  };

  const handleGenerarCronograma = async () => {
    const partidasIds: number[] = [];
    capitulosLocales.forEach(c => c.partidas?.forEach(p => partidasIds.push(p.id)));
    
    if (partidasIds.length === 0) return alert('No hay partidas para enviar al cronograma.');
    
    if (!confirm(`¿Quieres enviar ${partidasIds.length} partidas al cronograma de la obra?`)) return;

    try {
      setSaving(true);
      const res = await presupuestosApi.generarCronograma(presupuestoId, partidasIds);
      alert(res.message);
      await cargarPresupuesto();
      if (presupuesto?.obra_id) {
        if(confirm("¿Deseas ir al cronograma ahora para organizar las fechas?")) {
          router.push(`/obras/${presupuesto.obra_id}/cronograma`);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error al generar el cronograma');
    } finally {
      setSaving(false);
    }
  };

  const [showCapituloModal, setShowCapituloModal] = useState(false);
  const [nuevoCapituloNombre, setNuevoCapituloNombre] = useState('');

  const handleAddCapitulo = async () => {
    if (!nuevoCapituloNombre.trim()) return;
    try {
      setSaving(true);
      await presupuestosApi.crearCapitulo(presupuestoId, {
        nombre: nuevoCapituloNombre,
        orden: capitulosLocales.length
      });
      await cargarPresupuesto();
      setShowCapituloModal(false);
    } catch (e) {
      alert("Error al crear capítulo");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPartida = async (capituloId: number, indexCapitulo: number) => {
    try {
      setSaving(true);
      const cap = capitulosLocales[indexCapitulo];
      const numCapitulo = (indexCapitulo + 1).toString().padStart(2, '0');
      const numPartida = ((cap.partidas?.length || 0) + 1).toString().padStart(2, '0');
      const nuevoCodigo = `${numCapitulo}.${numPartida}`;

      await presupuestosApi.crearPartida(capituloId, {
        codigo: nuevoCodigo,
        descripcion: "Nueva Partida",
        unidad: "ud",
        cantidad: 1,
        coste_base: 0,
        coste_material: 0,
        porcentaje_indirectos: 0,
        porcentaje_comisiones: 0,
        coste_unitario: 0,
        precio_unitario: 0,
        descuento_porcentaje: 0,
        margen_porcentaje: 0
      });
      await cargarPresupuesto();
    } catch (e) {
      alert("Error al crear partida");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePartidaLocal = (capituloId: number, partidaId: number, field: string, value: any) => {
    const newCaps = capitulosLocales.map(cap => {
      if (cap.id !== capituloId) return cap;
      const newParts = cap.partidas.map(part => {
        if (part.id !== partidaId) return part;
        
        // Actualizamos el campo
        const isStringField = ['descripcion', 'codigo', 'unidad', 'observaciones'].includes(field);
        const updated = { ...part, [field]: isStringField ? value : (value === '' ? 0 : Number(value) || value) };
        
        if (isStringField) {
           return updated;
        }

        // Si cambia algún costo interno, recalculamos coste_unitario
        if (['coste_base', 'coste_material', 'porcentaje_indirectos', 'porcentaje_comisiones'].includes(field)) {
          const base = updated.coste_base || 0;
          const mat = updated.coste_material || 0;
          const ind = updated.porcentaje_indirectos || 0;
          const com = updated.porcentaje_comisiones || 0;
          updated.coste_unitario = (base + mat) * (1 + ind/100 + com/100);
        }

        // Recalculamos matematicas finales
        const descuentoMultiplicador = 1 - ((updated.descuento_porcentaje || 0) / 100);
        updated.importe = (updated.cantidad || 0) * (updated.precio_unitario || 0) * descuentoMultiplicador;
        updated.coste_total = (updated.cantidad || 0) * (updated.coste_unitario || 0);

        return updated;
      });
      
      const subtotal = newParts.reduce((acc, curr) => acc + (curr.importe || 0), 0);
      return { ...cap, partidas: newParts, subtotal };
    });
    setCapitulosLocales(newCaps);
  };

  const handleSavePartida = async (capituloId: number, partidaId: number) => {
    const cap = capitulosLocales.find(c => c.id === capituloId);
    const partida = cap?.partidas.find(p => p.id === partidaId);
    if (!partida) return;

    try {
      await presupuestosApi.actualizarPartida(partidaId, {
        codigo: partida.codigo,
        descripcion: partida.descripcion,
        unidad: partida.unidad,
        cantidad: partida.cantidad,
        coste_base: partida.coste_base,
        coste_material: partida.coste_material,
        porcentaje_indirectos: partida.porcentaje_indirectos,
        porcentaje_comisiones: partida.porcentaje_comisiones,
        coste_unitario: partida.coste_unitario,
        precio_unitario: partida.precio_unitario,
        descuento_porcentaje: partida.descuento_porcentaje,
        margen_porcentaje: partida.margen_porcentaje,
        observaciones: partida.observaciones
      });
      // Silent reload para mantener datos
      const data = await presupuestosApi.obtener(presupuestoId);
      setPresupuesto(data);
    } catch (e) {
      console.error("Error al guardar partida", e);
    }
  };

  const handleDeleteCapitulo = async (capituloId: number) => {
    if (!confirm("¿Seguro que quieres borrar este capítulo y todas sus partidas?")) return;
    try {
      setSaving(true);
      await presupuestosApi.borrarCapitulo(capituloId);
      await cargarPresupuesto();
    } catch (e) {
      alert("Error al borrar capítulo");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePartida = async (partidaId: number) => {
    if (!confirm("¿Seguro que quieres borrar esta partida?")) return;
    try {
      setSaving(true);
      await presupuestosApi.borrarPartida(partidaId);
      await cargarPresupuesto();
    } catch (e) {
      alert("Error al borrar partida");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (partidaId: number) => {
    const newExpanded = new Set(expandedPartidas);
    if (newExpanded.has(partidaId)) {
      newExpanded.delete(partidaId);
    } else {
      newExpanded.add(partidaId);
    }
    setExpandedPartidas(newExpanded);
  };

  if (loading) return <div className="p-8 text-center">Cargando editor...</div>;
  if (!presupuesto) return <div className="p-8 text-center text-error">Presupuesto no encontrado</div>;

  const isBorrador = presupuesto.estado === 'borrador';
  const costeDirectoDinamico = capitulosLocales.reduce((acc, cap) => acc + (cap.subtotal || 0), 0);
  const ivaDinamico = costeDirectoDinamico * (presupuesto.iva / 100);
  const totalDinamico = costeDirectoDinamico + ivaDinamico;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-main flex items-center gap-3">
              {presupuesto.codigo && <span className="text-brand-blue font-mono">{presupuesto.codigo}</span>}
              {presupuesto.nombre}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {presupuesto.obra_id ? `Asociado a Obra #${presupuesto.obra_id}` : 'Presupuesto Independiente (En Estudio)'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push(`/presupuestos/${presupuestoId}/certificaciones`)}
            variant="outlined" 
            className="text-text-main border-white/20 hover:bg-white/10 !min-h-0 h-[40px] py-0"
          >
            📋 Certificaciones
          </Button>

          <Button 
            onClick={() => window.open(`/pdf/presupuesto/${presupuestoId}`, '_blank')}
            variant="outlined" 
            className="text-text-main border-white/20 hover:bg-white/10 !min-h-0 h-[40px] py-0"
          >
            📄 PDF
          </Button>

          <Dropdown
            value={presupuesto.estado}
            options={[
              { value: 'borrador', label: 'Borrador' },
              { value: 'enviado', label: 'Enviado al Cliente' },
              { value: 'pendiente_aprobacion', label: 'Pendiente de aprobación' },
              { value: 'aprobado', label: 'Aprobado' },
              { value: 'en_ejecucion', label: 'En ejecución' },
              { value: 'finalizado', label: 'Finalizado' },
              { value: 'cancelado', label: 'Cancelado (Descartado)' }
            ]}
            onChange={(val) => handleChangeEstado(val)}
            disabled={saving}
          />
          
          {(presupuesto.estado === 'aprobado' || presupuesto.estado === 'en_ejecucion') && (
            <Button onClick={handleGenerarCronograma} variant="outlined" className="text-brand-blue border-brand-blue hover:bg-brand-blue/10">
              <Calendar className="w-4 h-4 mr-2" />
              {presupuesto.estado === 'aprobado' ? 'Pasar a Cronograma / Ejecución' : 'Actualizar Cronograma'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard padding="p-6" className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Detalles Comerciales</h3>
            <span className="text-xs bg-white/10 px-2 py-1 rounded">v{presupuesto.version}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-muted mb-1">Nombre del Presupuesto</p>
              <input 
                type="text" 
                defaultValue={presupuesto.nombre}
                onBlur={async (e) => {
                  if (e.target.value !== presupuesto.nombre) {
                    await presupuestosApi.actualizar(presupuestoId, { nombre: e.target.value });
                    cargarPresupuesto();
                  }
                }}
                disabled={!isBorrador}
                className="w-full bg-black/20 border-b border-white/10 p-2 rounded text-text-main focus:outline-none focus:border-brand-blue" 
              />
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Cliente</p>
              <input 
                type="text" 
                defaultValue={presupuesto.cliente_nombre || ''}
                onBlur={async (e) => {
                  if (e.target.value !== presupuesto.cliente_nombre) {
                    await presupuestosApi.actualizar(presupuestoId, { cliente_nombre: e.target.value });
                    cargarPresupuesto();
                  }
                }}
                disabled={!isBorrador}
                placeholder="Nombre del cliente o empresa..."
                className="w-full bg-black/20 border-b border-white/10 p-2 rounded text-text-main focus:outline-none focus:border-brand-blue" 
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <div className="flex-1">
                <p className="text-sm text-text-muted mb-1">Dirección de Obra</p>
                <input 
                  type="text" 
                  defaultValue={presupuesto.direccion || ''}
                  onBlur={async (e) => {
                    if (e.target.value !== presupuesto.direccion) {
                      await presupuestosApi.actualizar(presupuestoId, { direccion: e.target.value });
                      cargarPresupuesto();
                    }
                  }}
                  disabled={!isBorrador}
                  placeholder="Calle, Número, Ciudad..."
                  className="w-full bg-black/20 border-b border-white/10 p-2 rounded text-text-main focus:outline-none focus:border-brand-blue" 
                />
              </div>
              <div className="w-32">
                <p className="text-sm text-text-muted mb-1">C.P.</p>
                <input 
                  type="text" 
                  defaultValue={presupuesto.codigo_postal || ''}
                  onBlur={async (e) => {
                    if (e.target.value !== presupuesto.codigo_postal) {
                      await presupuestosApi.actualizar(presupuestoId, { codigo_postal: e.target.value });
                      cargarPresupuesto();
                    }
                  }}
                  disabled={!isBorrador}
                  placeholder="28001"
                  className="w-full bg-black/20 border-b border-white/10 p-2 rounded text-text-main focus:outline-none focus:border-brand-blue" 
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="p-6" className="bg-brand-navy/10 border-brand-blue/20 flex flex-col justify-center">
          <h3 className="text-sm text-brand-blue mb-1 font-semibold uppercase tracking-wider">Total Presupuesto</h3>
          <p className="text-4xl font-bold text-text-main">{totalDinamico.toLocaleString('es-ES')} €</p>
          <div className="flex justify-between mt-4 text-sm text-text-muted">
            <span>Base: {costeDirectoDinamico.toLocaleString('es-ES')} €</span>
            <span>IVA: {ivaDinamico.toLocaleString('es-ES')} €</span>
          </div>
        </GlassCard>
      </div>

      <GlassCard padding="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Desglose de Partidas</h2>
          {isBorrador && (
            <Button variant="outlined" className="text-sm py-1 px-3" onClick={() => { setNuevoCapituloNombre(''); setShowCapituloModal(true); }} disabled={saving}>
              <Plus className="w-4 h-4 mr-2" /> Añadir Capítulo
            </Button>
          )}
        </div>

        {showCapituloModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <GlassCard padding="p-6" className="w-full max-w-md animate-in zoom-in-95">
              <h2 className="text-xl font-bold mb-4">Nuevo Capítulo</h2>
              <p className="text-sm text-text-muted mb-4">Introduce el nombre del nuevo capítulo.</p>
              <div className="mb-6">
                <input 
                  type="text" 
                  value={nuevoCapituloNombre}
                  onChange={e => setNuevoCapituloNombre(e.target.value)}
                  autoFocus
                  placeholder="Ej. Movimiento de tierras"
                  className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue outline-none" 
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outlined" onClick={() => setShowCapituloModal(false)} disabled={saving}>Cancelar</Button>
                <Button variant="primary" onClick={handleAddCapitulo} disabled={saving || !nuevoCapituloNombre.trim()}>
                  {saving ? 'Creando...' : 'Añadir Capítulo'}
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        <div className="overflow-x-auto pb-10">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-text-muted">
              <tr>
                <th className="p-3 w-8"></th>
                <th className="p-3 font-semibold w-20">Código</th>
                <th className="p-3 font-semibold">Descripción</th>
                <th className="p-3 font-semibold text-right w-24">Cantidad</th>
                <th className="p-3 font-semibold text-center w-16">Unidad</th>
                <th className="p-3 font-semibold text-right w-28">Venta Ud.</th>
                <th className="p-3 font-semibold text-right w-24">Desc %</th>
                <th className="p-3 font-semibold text-right w-32">Importe</th>
              </tr>
            </thead>
            <tbody>
              {capitulosLocales.map((capitulo, indexCapitulo) => (
                <React.Fragment key={`cap-${capitulo.id}`}>
                  <tr className="bg-brand-navy/30 border-y border-brand-blue/30">
                    <td colSpan={2}></td>
                    <td className="p-3 font-bold text-brand-blue" colSpan={4}>
                      <span className="text-white/50 mr-2">{(indexCapitulo + 1).toString().padStart(2, '0')}</span>
                      {capitulo.nombre}
                    </td>
                    <td className="p-3 text-right">
                      {isBorrador && (
                        <button onClick={() => handleDeleteCapitulo(capitulo.id)} className="text-text-muted hover:text-error transition-colors p-1" title="Borrar Capítulo">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                    <td className="p-3 font-bold text-brand-blue text-right bg-brand-navy/50">
                      {capitulo.subtotal?.toLocaleString('es-ES')} €
                    </td>
                  </tr>
                  
                  {capitulo.partidas?.map((partida) => (
                    <React.Fragment key={`part-${partida.id}`}>
                      <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors group ${expandedPartidas.has(partida.id) ? 'bg-white/5' : ''}`}>
                        <td className="p-2 text-center">
                          <button onClick={() => toggleExpand(partida.id)} className="p-1 rounded hover:bg-white/10 text-brand-blue transition-colors">
                            {expandedPartidas.has(partida.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={partida.codigo} 
                            onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'codigo', e.target.value)}
                            onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                            disabled={!isBorrador} 
                            className="w-full bg-transparent font-mono text-xs text-text-muted border-b border-transparent focus:border-brand-blue outline-none" 
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={partida.descripcion} 
                            onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'descripcion', e.target.value)}
                            onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                            disabled={!isBorrador} 
                            className="w-full min-w-[200px] bg-transparent text-text-main border-b border-transparent focus:border-brand-blue outline-none" 
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={partida.cantidad === 0 ? '' : partida.cantidad} 
                            onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'cantidad', e.target.value)}
                            onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                            disabled={!isBorrador} 
                            className="w-full bg-transparent text-right border-b border-transparent focus:border-brand-blue outline-none group-hover:bg-white/5 rounded px-1" 
                          />
                        </td>
                        <td className="p-2 text-center text-text-muted">
                          <input 
                            type="text" 
                            value={partida.unidad} 
                            onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'unidad', e.target.value)}
                            onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                            disabled={!isBorrador} 
                            className="w-12 bg-transparent text-center border-b border-transparent focus:border-brand-blue outline-none" 
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-end">
                            <input 
                              type="number" 
                              value={partida.precio_unitario === 0 ? '' : partida.precio_unitario} 
                              onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'precio_unitario', e.target.value)}
                              onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                              disabled={!isBorrador} 
                              className="w-16 bg-transparent text-right text-success font-medium border-b border-transparent focus:border-brand-blue outline-none group-hover:bg-white/5 rounded px-1" 
                            />
                            <span className="text-xs ml-1 text-text-muted">€</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-end">
                            <input 
                              type="number" 
                              value={partida.descuento_porcentaje === 0 ? '' : partida.descuento_porcentaje} 
                              onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'descuento_porcentaje', e.target.value)}
                              onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                              disabled={!isBorrador} 
                              className="w-12 bg-transparent text-right text-error border-b border-transparent focus:border-brand-blue outline-none group-hover:bg-white/5 rounded px-1" 
                            />
                            <span className="text-xs ml-1 text-text-muted">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold bg-white/[0.02] flex items-center justify-end gap-2 h-[42px]">
                          <span>{partida.importe?.toLocaleString('es-ES')} €</span>
                          {isBorrador && (
                            <button onClick={() => handleDeletePartida(partida.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all p-1" title="Borrar Partida">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* DESGLOSE INTERNO EXPANDIBLE */}
                      {expandedPartidas.has(partida.id) && (
                        <tr className="bg-brand-navy/10 border-b border-brand-blue/20">
                          <td colSpan={2}></td>
                          <td colSpan={6} className="p-4">
                            <div className="flex flex-wrap gap-6 items-end bg-surface border border-white/5 p-4 rounded-xl shadow-inner">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Coste Mano Obra</label>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    value={partida.coste_base === 0 ? '' : partida.coste_base} 
                                    onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'coste_base', e.target.value)}
                                    onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                                    disabled={!isBorrador} 
                                    className="w-20 bg-transparent text-right border-b border-white/20 focus:border-brand-blue outline-none" 
                                  />
                                  <span className="text-xs ml-1 text-text-muted">€</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Coste Material</label>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    value={partida.coste_material === 0 ? '' : partida.coste_material} 
                                    onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'coste_material', e.target.value)}
                                    onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                                    disabled={!isBorrador} 
                                    className="w-20 bg-transparent text-right border-b border-white/20 focus:border-brand-blue outline-none" 
                                  />
                                  <span className="text-xs ml-1 text-text-muted">€</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">% Indirectos</label>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    value={partida.porcentaje_indirectos === 0 ? '' : partida.porcentaje_indirectos} 
                                    onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'porcentaje_indirectos', e.target.value)}
                                    onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                                    disabled={!isBorrador} 
                                    className="w-16 bg-transparent text-right border-b border-white/20 focus:border-brand-blue outline-none" 
                                  />
                                  <span className="text-xs ml-1 text-text-muted">%</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">% Comisiones</label>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    value={partida.porcentaje_comisiones === 0 ? '' : partida.porcentaje_comisiones} 
                                    onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'porcentaje_comisiones', e.target.value)}
                                    onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                                    disabled={!isBorrador} 
                                    className="w-16 bg-transparent text-right border-b border-white/20 focus:border-brand-blue outline-none" 
                                  />
                                  <span className="text-xs ml-1 text-text-muted">%</span>
                                </div>
                              </div>
                              
                              <div className="ml-auto flex items-center gap-4 bg-brand-navy/30 px-4 py-2 rounded-lg border border-brand-blue/30">
                                <div className="text-right">
                                  <p className="text-[10px] text-brand-blue uppercase tracking-wider font-semibold">Coste Unitario Calc.</p>
                                  <p className="font-bold text-warning">{partida.coste_unitario?.toLocaleString('es-ES')} €</p>
                                </div>
                                <div className="text-right border-l border-white/10 pl-4">
                                  <p className="text-[10px] text-brand-blue uppercase tracking-wider font-semibold">Beneficio Bruto Ud.</p>
                                  <p className="font-bold text-success">
                                    {((partida.precio_unitario || 0) - (partida.coste_unitario || 0)).toLocaleString('es-ES')} €
                                  </p>
                                </div>
                              </div>
                              
                              {/* NUEVO: Descripción Detallada PDF */}
                              <div className="w-full mt-4 pt-4 border-t border-white/10">
                                <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">Descripción Detallada (Para Exportación PDF)</label>
                                <textarea 
                                  rows={3}
                                  value={partida.observaciones || ''}
                                  onChange={(e) => handleUpdatePartidaLocal(capitulo.id, partida.id, 'observaciones', e.target.value)}
                                  onBlur={() => handleSavePartida(capitulo.id, partida.id)}
                                  disabled={!isBorrador}
                                  placeholder="Redacta aquí todos los detalles de materiales, mano de obra, ejecución y condiciones que justifican esta partida..."
                                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-text-main focus:border-brand-blue focus:outline-none resize-y"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  
                  {isBorrador && (
                    <tr>
                      <td colSpan={8} className="p-2 text-center bg-white/[0.01] border-b border-white/5">
                        <button onClick={() => handleAddPartida(capitulo.id, indexCapitulo)} disabled={saving} className="text-xs font-medium text-brand-blue hover:text-brand-blue-light transition-colors py-2 px-4 rounded hover:bg-brand-blue/10">
                          + Añadir partida a {capitulo.nombre}
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {!capitulosLocales.length && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-muted">
                    No hay capítulos en este presupuesto. Comienza añadiendo uno.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {showAprobarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard padding="p-6" className="w-full max-w-md animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Aprobar Presupuesto</h2>
            <p className="text-sm text-text-muted mb-6">
              Al aprobar el presupuesto, se marcará como activo y no podrá modificarse. 
              {!presupuesto.obra_id && " Como este presupuesto no tiene obra, crearemos una nueva."}
            </p>

            {!presupuesto.obra_id && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Nombre de la nueva Obra</label>
                  <input 
                    type="text" 
                    value={obraNombre}
                    onChange={e => setObraNombre(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Dirección (opcional)</label>
                  <input 
                    type="text" 
                    value={obraDireccion}
                    onChange={e => setObraDireccion(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-lg p-2.5 text-text-main focus:border-brand-blue outline-none" 
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outlined" onClick={() => setShowAprobarModal(false)}>Cancelar</Button>
              <Button onClick={handleAprobar} variant="primary">Aprobar Definitivamente</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
