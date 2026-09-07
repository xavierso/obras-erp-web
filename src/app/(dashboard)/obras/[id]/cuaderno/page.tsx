'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cuadernoApi, NotaCuaderno, TipoNotaCuaderno } from '@/lib/cuadernoApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { useAuth } from '@/context/AuthContext';
import { isUserLector } from '@/lib/authApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';

export default function CuadernoListPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  const { user } = useAuth();
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [notas, setNotas] = useState<NotaCuaderno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoNotaCuaderno | ''>('');

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const [obraData, notasData] = await Promise.all([
        obrasApi.obtener(obraId),
        cuadernoApi.listar(obraId, filtroTipo || undefined)
      ]);
      setObra(obraData);
      setNotas(notasData);
    } catch (err) {
      setError((err as Error).message || 'Error al cargar el cuaderno');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(obraId)) {
      fetchDatos();
    }
  }, [obraId, filtroTipo]);

  const tiposDisponibles: { value: TipoNotaCuaderno | '', label: string }[] = [
    { value: '', label: 'TODAS' },
    { value: 'nota', label: 'NOTAS' },
    { value: 'croquis', label: 'CROQUIS' },
    { value: 'visita', label: 'VISITAS' },
    { value: 'tarea', label: 'TAREAS' },
    { value: 'incidencia', label: 'INCIDENCIAS' },
    { value: 'presupuesto', label: 'PRESUPUESTOS' },
    { value: 'certificacion', label: 'CERTIFICACIONES' },
    { value: 'pedido', label: 'PEDIDOS' },
    { value: 'otro', label: 'OTROS' },
  ];

  if (loading && !obra) return <div className="text-center py-10 text-text-muted">Cargando...</div>;
  if (error || !obra) return <div className="text-error">{error || 'Error'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => router.push(`/obras/${obraId}`)} className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Cuaderno de Obra</h1>
          <p className="text-text-muted text-sm">{obra.nombre} ({obra.codigo})</p>
        </div>
      </div>

      <GlassCard padding="p-6">
        <div className="flex flex-row justify-between items-center mb-6 gap-4">
          <div className="flex-1 max-w-[200px]">
            <Dropdown
              value={filtroTipo}
              onChange={(val) => setFiltroTipo(val as any)}
              fullWidth
              options={tiposDisponibles.map(t => ({
                value: t.value,
                label: t.label
              }))}
            />
          </div>

          {!isUserLector(user) && (
            <Button onClick={() => router.push(`/obras/${obraId}/cuaderno/nuevo`)} className="px-6">
              + NUEVA NOTA
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-text-muted">Cargando notas...</div>
        ) : notas.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <p>El cuaderno está vacío.</p>
            <p className="text-xs mt-2">Crea una nueva nota para empezar a dibujar o escribir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notas.map(nota => (
              <div key={nota.id} onClick={() => router.push(`/obras/${obraId}/cuaderno/${nota.id}`)} className="cursor-pointer p-4 bg-white/5 border border-white/5 rounded-xl hover:border-accent/50 transition-colors flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-text-main uppercase">
                      {nota.tipo}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(nota.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-text-main font-semibold text-lg line-clamp-2 mt-2">
                    {nota.titulo || 'Sin título'}
                  </h4>
                  {nota.entidad_relacionada_tipo && nota.entidad_relacionada_id && (
                    <div className="mt-3 flex items-center text-xs text-accent">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      {nota.entidad_relacionada_tipo.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
