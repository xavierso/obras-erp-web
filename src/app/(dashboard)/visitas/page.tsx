'use client';
import { useEffect, useState } from 'react';
import { visitasApi, VisitaConObra } from '@/lib/visitasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiClient';

export default function VisitasGlobalesPage() {
  const [visitas, setVisitas] = useState<VisitaConObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVisitas = async () => {
      try {
        const data = await visitasApi.listarTodas(50);
        setVisitas(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al cargar las visitas');
      } finally {
        setLoading(false);
      }
    };
    fetchVisitas();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Registro de Visitas</h1>
          <p className="text-text-muted text-sm">Todas las visitas de la empresa</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-text-muted">Cargando visitas...</div>
      ) : visitas.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-text-muted">No se han registrado visitas aún.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/20 before:to-transparent">
          {visitas.map((visita) => (
            <div key={visita.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-bg-base bg-brand-blue shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4">
                <GlassCard padding="p-5" className="hover:border-accent transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-accent">
                      {new Date(visita.fecha).toLocaleString()}
                    </span>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-text-muted">
                      {visita.obra_codigo}
                    </span>
                  </div>
                  <Link href={`/obras/${visita.obra_id}`} className="block group-hover:text-accent transition-colors">
                    <h3 className="font-bold text-text-main mb-2">{visita.obra_nombre}</h3>
                  </Link>
                  {visita.descripcion && (
                    <p className="text-sm text-text-muted mb-3 line-clamp-3">{visita.descripcion}</p>
                  )}
                  
                  {visita.archivos && visita.archivos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {visita.archivos.map(archivo => (
                        <div key={archivo.id} className="w-12 h-12 rounded bg-white/10 overflow-hidden flex items-center justify-center relative">
                           {archivo.tipo === 'foto' ? (
                             <img src={getApiUrl(archivo.url)} alt="Visita adjunto" className="w-full h-full object-cover" />
                           ) : (
                             <div className="text-text-muted flex items-center justify-center bg-black/40 w-full h-full">
                               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                             </div>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
