'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cuadernoApi, NotaCuaderno, TipoNotaCuaderno } from '@/lib/cuadernoApi';
import { LienzoDibujo } from '@/components/cuaderno/LienzoDibujo';
import { Dropdown } from '@/components/ui/Dropdown';

import { obrasApi } from '@/lib/obrasApi';

export default function DetalleNotaPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  const notaId = parseInt(params.notaId as string, 10);
  
  const [nota, setNota] = useState<NotaCuaderno | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoNotaCuaderno>('nota');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [obraInfo, setObraInfo] = useState<{codigo: string, nombre: string} | null>(null);
  const [relatedEntities, setRelatedEntities] = useState<{value: number, label: string}[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  useEffect(() => {
    if (!isNaN(obraId) && !isNaN(notaId)) {
      setLoading(true);
      cuadernoApi.obtener(obraId, notaId)
        .then(n => {
          setNota(n);
          setTitulo(n.titulo || '');
          setTipo(n.tipo);
        })
        .catch(e => alert(e.message))
        .finally(() => setLoading(false));

      obrasApi.obtener(obraId)
        .then(data => setObraInfo({ codigo: data.codigo || '', nombre: data.nombre || '' }))
        .catch(e => console.error(e));
    }
  }, [obraId, notaId]);

  useEffect(() => {
    if (!nota?.entidad_relacionada_tipo || isNaN(obraId)) {
      setRelatedEntities([]);
      return;
    }
    const type = nota.entidad_relacionada_tipo;
    setLoadingEntities(true);
    
    const fetchEntities = async () => {
      try {
        let list: {value: number, label: string}[] = [];
        if (type === 'visita') {
          const { visitasApi } = await import('@/lib/visitasApi');
          const data = await visitasApi.listar(obraId);
          list = data.map(d => ({ value: d.id, label: `Visita ${new Date(d.fecha).toLocaleDateString()}` }));
        } else if (type === 'tarea') {
          const { tareasApi } = await import('@/lib/tareasApi');
          const data = await tareasApi.listarPorObra(obraId);
          list = data.map(d => ({ value: d.id, label: d.titulo }));
        } else if (type === 'incidencia') {
          const { incidenciasApi } = await import('@/lib/incidenciasApi');
          const data = await incidenciasApi.listarPorObra(obraId);
          list = data.map(d => ({ value: d.id, label: d.titulo }));
        } else if (type === 'presupuesto') {
          const { presupuestosApi } = await import('@/lib/presupuestosApi');
          const data = await presupuestosApi.listarPorObra(obraId);
          list = data.map(d => ({ value: d.id, label: d.codigo || `Presupuesto ${d.id}` }));
        }
        setRelatedEntities(list);
      } catch (e) {
        console.error(e);
        setRelatedEntities([]);
      } finally {
        setLoadingEntities(false);
      }
    };
    fetchEntities();
  }, [nota?.entidad_relacionada_tipo, obraId]);

  const handleSave = async (canvasData: any) => {
    try {
      setSaving(true);
      await cuadernoApi.actualizar(obraId, notaId, {
        titulo,
        tipo,
        canvas_data: canvasData
      });
      alert('Guardado correctamente');
    } catch (err) {
      alert((err as Error).message || 'Error al guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (!nota) return <div className="p-10 text-center">Nota no encontrada</div>;

  const requiresDynamicDropdown = ['visita', 'tarea', 'incidencia', 'presupuesto'].includes(nota.entidad_relacionada_tipo || '');

  return (
    <div className="flex flex-col flex-1 w-full min-h-[70vh] space-y-4">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        
        {/* Left Side: Back Button + Main Content */}
        <div className="flex items-start gap-4 flex-1 w-full min-w-0">
          <button onClick={() => router.push(`/obras/${obraId}/cuaderno`)} className="mt-2 text-text-muted hover:text-accent transition-colors flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex flex-col gap-4 w-full min-w-0">
            {/* Top Row: Title, Trash, Category */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              {/* Title */}
              <div className="flex items-center gap-2 min-w-0">
                <input 
                  type="text" 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-text-main border-none focus:outline-none focus:ring-0 min-w-[150px] w-auto max-w-[200px] sm:max-w-[300px]"
                  placeholder="Título"
                />
              </div>

              {/* Category Dropdown */}
              <div className="w-[180px] md:w-48 flex-shrink-0">
                <Dropdown
                  value={tipo}
                  onChange={(val) => setTipo(val as TipoNotaCuaderno)}
                  options={[
                    { value: 'nota', label: 'NOTA' },
                    { value: 'croquis', label: 'CROQUIS' },
                    { value: 'visita', label: 'VISITA' },
                    { value: 'tarea', label: 'TAREA' },
                    { value: 'incidencia', label: 'INCIDENCIA' },
                    { value: 'presupuesto', label: 'PRESUPUESTO' },
                    { value: 'certificacion', label: 'CERTIFICACIÓN' },
                    { value: 'pedido', label: 'PEDIDO' },
                    { value: 'otro', label: 'OTRO' }
                  ]}
                  fullWidth
                />
              </div>
            </div>
            
            {/* Bottom Row: Dynamic Linking */}
            <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-4 sm:gap-6 text-text-muted mt-2">
              <span className="whitespace-nowrap font-medium">Vincular con:</span>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="w-[200px] sm:w-[160px] flex-shrink-0">
                  <Dropdown
                    value={nota.entidad_relacionada_tipo || ''}
                    onChange={val => {
                      cuadernoApi.actualizar(obraId, notaId, { entidad_relacionada_tipo: val || undefined, entidad_relacionada_id: undefined })
                        .then(n => setNota({...n, canvasData: nota.canvasData}));
                    }}
                    options={[
                      { value: '', label: '(Ninguna)' },
                      { value: 'visita', label: 'Visita' },
                      { value: 'tarea', label: 'Tarea' },
                      { value: 'incidencia', label: 'Incidencia' },
                      { value: 'presupuesto', label: 'Presupuesto' },
                      { value: 'certificacion', label: 'Certificación' },
                      { value: 'pedido', label: 'Pedido' }
                    ]}
                    fullWidth
                  />
                </div>
                
                {nota.entidad_relacionada_tipo && (
                  requiresDynamicDropdown ? (
                    <div className="w-[200px] sm:w-[200px] flex-shrink-0">
                      {loadingEntities ? (
                        <span className="text-text-muted px-2 py-2">Cargando...</span>
                      ) : (
                        <Dropdown
                          value={nota.entidad_relacionada_id ? nota.entidad_relacionada_id.toString() : ''}
                          onChange={val => {
                            cuadernoApi.actualizar(obraId, notaId, { entidad_relacionada_id: val ? Number(val) : undefined })
                              .then(n => setNota({...n, canvasData: nota.canvasData}));
                          }}
                          options={[
                            { value: '', label: 'Seleccionar...' },
                            ...relatedEntities.map(e => ({ value: e.value.toString(), label: e.label }))
                          ]}
                          fullWidth
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-[200px] sm:w-[140px] flex-shrink-0">
                      <input 
                        type="number"
                        placeholder="ID (Manual)"
                        value={nota.entidad_relacionada_id || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          cuadernoApi.actualizar(obraId, notaId, { entidad_relacionada_id: isNaN(val) ? undefined : val })
                            .then(n => setNota({...n, canvasData: nota.canvasData}));
                        }}
                        className="bg-white/5 border border-white/20 focus:outline-none focus:border-accent text-white px-4 py-2 h-10 rounded-xl w-full"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-black/40 rounded-xl min-h-[60vh] md:min-h-[500px]">
        <LienzoDibujo 
          initialData={{
            ...nota?.canvasData,
            pdfHeader: {
              obra: obraInfo ? `${obraInfo.codigo} ${obraInfo.nombre}` : `Obra ${obraId}`,
              asignado: nota?.entidad_relacionada_tipo || 'General',
              fecha: new Date(nota?.created_at || Date.now()).toLocaleDateString()
            }
          }} 
          onSave={handleSave} 
          saving={saving} 
        />
      </div>
    </div>
  );
}
