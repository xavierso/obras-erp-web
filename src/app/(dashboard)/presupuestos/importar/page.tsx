'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { importacionApi, ResultadoAnalisis, CapituloIntermedio, PartidaIntermedia } from '@/lib/importacionApi';

export default function ImportarPresupuestoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('target_id');
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analisis, setAnalisis] = useState<ResultadoAnalisis | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await importacionApi.analizar(file);
      setAnalisis(data);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al analizar el archivo. Comprueba el formato.');
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataChange = (field: string, value: string | number) => {
    if (analisis) {
      setAnalisis({
        ...analisis,
        metadatos: {
          ...analisis.metadatos,
          [field]: value,
        }
      });
    }
  };

  const handlePartidaChange = (path: number[], partidaIndex: number, field: keyof PartidaIntermedia, value: any) => {
    if (!analisis) return;
    const nuevosCapitulos = JSON.parse(JSON.stringify(analisis.capitulos));
    
    let currentLevel = nuevosCapitulos;
    for (let i = 0; i < path.length - 1; i++) {
      currentLevel = currentLevel[path[i]].subcapitulos;
    }
    const capitulo = currentLevel[path[path.length - 1]];
    const nuevaPartida = { ...capitulo.partidas[partidaIndex], [field]: value };
    capitulo.partidas[partidaIndex] = nuevaPartida;
    
    if (field === 'cantidad' || field === 'precio_unitario' || field === 'descuento_porcentaje') {
        const cantidad = Number(nuevaPartida.cantidad) || 0;
        const precio = Number(nuevaPartida.precio_unitario) || 0;
        const desc = Number(nuevaPartida.descuento_porcentaje) || 0;
        nuevaPartida.importe = cantidad * precio * (1 - desc / 100);
    }

    setAnalisis({
      ...analisis,
      capitulos: nuevosCapitulos
    });
  };

  const handleMovePartida = (path: number[], partidaIndex: number, direction: 'up' | 'down') => {
    if (!analisis) return;
    const nuevosCapitulos = JSON.parse(JSON.stringify(analisis.capitulos));
    
    let currentLevel = nuevosCapitulos;
    for (let i = 0; i < path.length - 1; i++) {
      currentLevel = currentLevel[path[i]].subcapitulos;
    }
    const capitulo = currentLevel[path[path.length - 1]];
    const partidas = capitulo.partidas;

    if (direction === 'up' && partidaIndex > 0) {
      [partidas[partidaIndex - 1], partidas[partidaIndex]] = [partidas[partidaIndex], partidas[partidaIndex - 1]];
    } else if (direction === 'down' && partidaIndex < partidas.length - 1) {
      [partidas[partidaIndex + 1], partidas[partidaIndex]] = [partidas[partidaIndex], partidas[partidaIndex + 1]];
    } else {
      return;
    }

    setAnalisis({
      ...analisis,
      capitulos: nuevosCapitulos
    });
  };

  const handleConfirm = async () => {
    if (!analisis) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nombre: analisis.metadatos.nombre_obra || "Presupuesto Importado",
        cliente_nombre: analisis.metadatos.cliente,
        direccion: analisis.metadatos.direccion,
        iva: analisis.metadatos.iva || 21.0,
        archivo_origen: analisis.metadatos.nombre_obra,
        target_id: targetId ? parseInt(targetId) : null,
        capitulos: analisis.capitulos
      };
      const result = await importacionApi.confirmar(payload);
      router.push(`/presupuestos/${result.id || targetId || ''}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al confirmar la importación.');
      setSaving(false);
    }
  };

  
  const renderCapitulo = (capitulo: CapituloIntermedio, path: number[], level: number = 0) => {
    return (
      <React.Fragment key={path.join('-')}>
        <tr className="bg-white/5 border-b border-white/5">
          <td className="p-3 font-bold text-white" style={{ paddingLeft: `${0.75 + level * 1.5}rem` }}>{capitulo.codigo}</td>
          <td className="p-3 font-bold text-white" colSpan={7}>{capitulo.nombre}</td>
          <td className="p-3"></td>
        </tr>
        
        {capitulo.subcapitulos?.map((sub, idx) => renderCapitulo(sub, [...path, idx], level + 1))}
        
        {capitulo.partidas?.map((partida, partIdx) => (
          <React.Fragment key={`${path.join('-')}-p${partIdx}`}>
            <tr className="hover:bg-white/5 transition-colors border-b border-white/5">
              <td className="p-2" style={{ paddingLeft: `${1.5 + level * 1.5}rem` }}>
                <input 
                  className="bg-transparent text-white w-full outline-none focus:border-b focus:border-accent" 
                  value={partida.codigo}
                  onChange={(e) => handlePartidaChange(path, partIdx, 'codigo', e.target.value)}
                />
              </td>
              <td className="p-2 min-w-[200px]">
                <input 
                  className="bg-transparent text-white w-full outline-none focus:border-b focus:border-accent" 
                  value={partida.descripcion}
                  onChange={(e) => handlePartidaChange(path, partIdx, 'descripcion', e.target.value)}
                />
              </td>
              <td className="p-2 w-20">
                <input 
                  className="bg-transparent text-white w-full outline-none focus:border-b focus:border-accent" 
                  value={partida.unidad}
                  onChange={(e) => handlePartidaChange(path, partIdx, 'unidad', e.target.value)}
                />
              </td>
              <td className="p-2 w-24">
                <input 
                  type="number"
                  className="bg-transparent text-white w-full outline-none focus:border-b focus:border-accent text-right" 
                  value={partida.cantidad}
                  onChange={(e) => handlePartidaChange(path, partIdx, 'cantidad', parseFloat(e.target.value))}
                />
              </td>
              <td className="p-2 w-28">
                <input 
                  type="number"
                  className="bg-transparent text-white w-full outline-none focus:border-b focus:border-accent text-right" 
                  value={partida.precio_unitario}
                  onChange={(e) => handlePartidaChange(path, partIdx, 'precio_unitario', parseFloat(e.target.value))}
                />
              </td>
              <td className="p-2 w-20">
                <input 
                  type="number"
                  className="bg-transparent text-white w-full outline-none focus:border-b focus:border-accent text-right" 
                  value={partida.descuento_porcentaje}
                  onChange={(e) => handlePartidaChange(path, partIdx, 'descuento_porcentaje', Number(e.target.value))}
                />
              </td>
              <td className="p-2 text-right">
                {partida.importe.toFixed(2)} €
              </td>
              <td className="p-2 w-10 text-center">
                <span title={partida.warnings.join('\n')}>
                  {partida.status === 'ok' && <span className="text-green-400">✓</span>}
                  {partida.status === 'warning' && <span className="text-yellow-400 cursor-help">⚠️</span>}
                  {partida.status === 'error' && <span className="text-red-400 cursor-help">❌</span>}
                </span>
              </td>
              <td className="p-2 text-center w-16">
                <div className="flex flex-col gap-1 items-center justify-center">
                  <button 
                    onClick={() => handleMovePartida(path, partIdx, 'up')}
                    disabled={partIdx === 0}
                    className="text-text-muted hover:text-white disabled:opacity-30 p-1 leading-none text-xs"
                    title="Mover arriba"
                  >▲</button>
                  <button 
                    onClick={() => handleMovePartida(path, partIdx, 'down')}
                    disabled={partIdx === (capitulo.partidas?.length || 0) - 1}
                    className="text-text-muted hover:text-white disabled:opacity-30 p-1 leading-none text-xs"
                    title="Mover abajo"
                  >▼</button>
                </div>
              </td>
            </tr>
            {partida.lineas_medicion && partida.lineas_medicion.length > 0 && (
              <tr className="bg-white/5">
                <td colSpan={9} className="p-2 text-sm text-gray-300" style={{ paddingLeft: `${3 + level * 1.5}rem` }}>
                  <div className="grid grid-cols-6 gap-2 mb-1 text-gray-400 font-semibold border-b border-white/10 pb-1">
                    <div className="col-span-2">Líneas de Medición ({partida.lineas_medicion.length})</div>
                    <div className="text-right">N</div>
                    <div className="text-right">Long.</div>
                    <div className="text-right">Anch.</div>
                    <div className="text-right">Alt.</div>
                  </div>
                  {partida.lineas_medicion.map((lm, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-2 py-0.5 border-b border-white/5 last:border-0">
                      <div className="col-span-2 truncate">{lm.comentario || '-'}</div>
                      <div className="text-right">{lm.unidades ?? ''}</div>
                      <div className="text-right">{lm.longitud ?? ''}</div>
                      <div className="text-right">{lm.anchura ?? ''}</div>
                      <div className="text-right">{lm.altura ?? ''}</div>
                    </div>
                  ))}
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  };

  const renderStepper = () => (
    <div className="flex items-center justify-center mb-8 w-full max-w-3xl mx-auto">
      <div className="flex items-center w-full">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-accent text-white' : 'bg-surface border border-white/10 text-text-muted'}`}>1</div>
        <div className={`flex-1 h-px mx-4 ${step >= 2 ? 'bg-accent' : 'bg-white/10'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-accent text-white' : 'bg-surface border border-white/10 text-text-muted'}`}>2</div>
        <div className={`flex-1 h-px mx-4 ${step >= 3 ? 'bg-accent' : 'bg-white/10'}`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-accent text-white' : 'bg-surface border border-white/10 text-text-muted'}`}>3</div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Asistente de Importación</h1>
          <p className="text-text-muted">Sube tu archivo PDF o Excel para crear un presupuesto automáticamente.</p>
        </div>
      </div>

      {renderStepper()}

      <div className="space-y-6">
        {step === 1 && (
          <GlassCard className="p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-6">Selecciona el archivo</h2>
            
            <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:bg-white/5 transition-colors relative">
              <input 
                type="file" 
                accept=".xlsx,.xls,.pdf" 
                onChange={handleFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-6xl mb-4">📄</div>
              <p className="text-white font-medium mb-2">Arrastra tu archivo aquí o haz clic para buscar</p>
              <p className="text-text-muted text-sm">Formatos soportados: Excel (.xlsx), PDF (.pdf)</p>
              {file && (
                <div className="mt-6 inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full border border-accent/30">
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button variant="primary" onClick={handleAnalyze} disabled={!file || loading}>
                {loading ? 'Analizando...' : 'Analizar Archivo'} &rarr;
              </Button>
            </div>
          </GlassCard>
        )}

        {step === 2 && analisis && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Metadatos Detectados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Nombre de la Obra</label>
                  <input 
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white"
                    value={analisis.metadatos.nombre_obra || ''}
                    onChange={(e) => handleMetadataChange('nombre_obra', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Cliente</label>
                  <input 
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white"
                    value={analisis.metadatos.cliente || ''}
                    onChange={(e) => handleMetadataChange('cliente', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Dirección</label>
                  <input 
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white"
                    value={analisis.metadatos.direccion || ''}
                    onChange={(e) => handleMetadataChange('direccion', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">IVA (%)</label>
                  <input 
                    type="number"
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white"
                    value={analisis.metadatos.iva || 21}
                    onChange={(e) => handleMetadataChange('iva', Number(e.target.value))}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Estructura del Presupuesto</h2>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1"><span className="text-green-400">✓</span> {analisis.partidas_ok} Correctas</div>
                  <div className="flex items-center gap-1"><span className="text-yellow-400">⚠️</span> {analisis.partidas_warning} Avisos</div>
                  <div className="flex items-center gap-1"><span className="text-red-400">❌</span> {analisis.partidas_error} Errores</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black/40 text-text-muted text-left">
                    <tr>
                      <th className="p-3 font-medium">Código</th>
                      <th className="p-3 font-medium">Descripción</th>
                      <th className="p-3 font-medium">Ud</th>
                      <th className="p-3 font-medium">Cantidad</th>
                      <th className="p-3 font-medium">Precio</th>
                      <th className="p-3 font-medium">Desc %</th>
                      <th className="p-3 font-medium text-right">Importe</th>
                      <th className="p-3 font-medium text-center">Estado</th>
                      <th className="p-3 font-medium text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analisis.capitulos.map((cap, capIdx) => renderCapitulo(cap, [capIdx], 0))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <div className="flex justify-between mt-8">
              <Button variant="outlined" onClick={() => setStep(1)}>
                &larr; Volver
              </Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                Confirmar Importación &rarr;
              </Button>
            </div>
          </div>
        )}

        {step === 3 && analisis && (
          <GlassCard className="p-8 max-w-2xl mx-auto text-center">
            <div className="text-5xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Todo listo!</h2>
            <p className="text-text-muted mb-8">
              Vamos a importar el presupuesto <strong>{analisis.metadatos.nombre_obra || 'Sin nombre'}</strong> con 
              {' '}<span className="text-white font-medium">{analisis.total_capitulos}</span> capítulos y 
              {' '}<span className="text-white font-medium">{analisis.total_partidas}</span> partidas.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Importe Total:</span>
                <span className="text-accent font-bold text-lg">{analisis.importe_total_detectado.toLocaleString('es-ES')} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Cliente:</span>
                <span className="text-white">{analisis.metadatos.cliente || 'No especificado'}</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                variant="primary" 
                className="w-full h-12 text-lg" 
                onClick={handleConfirm}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar en Base de Datos'}
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)} disabled={saving}>
                Revisar de nuevo
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
