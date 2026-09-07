'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cuadernoApi, TipoNotaCuaderno } from '@/lib/cuadernoApi';
import { obrasApi } from '@/lib/obrasApi';
import { LienzoDibujo } from '@/components/cuaderno/LienzoDibujo';
import { Dropdown } from '@/components/ui/Dropdown';

export default function NuevaNotaPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  
  const [titulo, setTitulo] = useState('Nueva Nota');
  const [tipo, setTipo] = useState<TipoNotaCuaderno>('croquis');
  const [saving, setSaving] = useState(false);
  const [obraInfo, setObraInfo] = useState<{codigo: string, nombre: string} | null>(null);

  useEffect(() => {
    if (!isNaN(obraId)) {
      obrasApi.obtener(obraId)
        .then(data => setObraInfo({ codigo: data.codigo || '', nombre: data.nombre || '' }))
        .catch(e => console.error(e));
    }
  }, [obraId]);

  const handleSave = async (canvasData: any) => {
    try {
      setSaving(true);
      await cuadernoApi.crear(obraId, {
        titulo,
        tipo,
        canvas_data: canvasData
      });
      router.push(`/obras/${obraId}/cuaderno`);
    } catch (err) {
      alert((err as Error).message || 'Error al guardar la nota');
    } finally {
      setSaving(false);
    }
  };

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
            {/* Top Row: Title, Category */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              {/* Title */}
              <div className="flex items-center gap-2 min-w-0">
                <input 
                  type="text" 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-text-main border-none focus:outline-none focus:ring-0 min-w-[150px] w-auto max-w-[200px] sm:max-w-[300px]"
                  placeholder="Título de la nota"
                />
              </div>

              {/* Category Dropdown */}
              <div className="w-[200px] md:w-48 flex-shrink-0">
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
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white/5 rounded-xl border border-white/10 min-h-[60vh] md:min-h-[500px]">
        <LienzoDibujo 
          initialData={{
            pdfHeader: {
              obra: obraInfo ? `${obraInfo.codigo} ${obraInfo.nombre}` : `Obra ${obraId}`,
              asignado: tipo || 'General',
              fecha: new Date().toLocaleDateString()
            }
          }} 
          onSave={handleSave} 
          saving={saving} 
        />
      </div>
    </div>
  );
}
