'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { visitasApi, Visita } from '@/lib/visitasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiClient';
import { tareasApi, Tarea } from '@/lib/tareasApi';
import { ListaTareas } from '@/components/tareas/ListaTareas';
import { incidenciasApi, Incidencia } from '@/lib/incidenciasApi';
import { ListaIncidencias } from '@/components/incidencias/ListaIncidencias';

export default function VisitaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  const visitaId = parseInt(params.visita_id as string, 10);
  
  const [visita, setVisita] = useState<Visita | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchVisita = async () => {
      if (isNaN(obraId) || isNaN(visitaId)) return;
      try {
        setLoading(true);
        const [data, tareasData, incidenciasData] = await Promise.all([
          visitasApi.obtener(obraId, visitaId),
          tareasApi.listarPorObra(obraId, { visita_id: visitaId }),
          incidenciasApi.listarPorObra(obraId, { visita_id: visitaId })
        ]);
        setVisita(data);
        setDescripcion(data.descripcion || '');
        setTareas(tareasData);
        setIncidencias(incidenciasData);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al cargar la visita');
      } finally {
        setLoading(false);
      }
    };
    fetchVisita();
  }, [obraId, visitaId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const data = await visitasApi.actualizar(obraId, visitaId, descripcion, archivos);
      setVisita(data);
      setIsEditing(false);
      setArchivos([]);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la visita');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-text-muted">Cargando visita...</div>;
  }

  if (!visita) {
    return (
      <div className="text-center py-20 text-error">
        No se encontró la visita o hubo un error.
        <div className="mt-4">
          <Link href={`/obras/${obraId}`}>
            <Button variant="outlined">Volver a la Obra</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Button variant="outlined" className="!px-3 !py-2" onClick={() => router.back()}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {isEditing ? 'Editar Visita' : 'Detalles de la Visita'}
          </h1>
          <p className="text-text-muted text-sm">
            {new Date(visita.fecha).toLocaleString()}
          </p>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-text-muted text-sm font-semibold ml-1">Observaciones</label>
              {!isEditing && (
                <Button type="button" variant="outlined" className="!py-1.5 !px-3 text-xs" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl text-text-main focus:border-brand-blue outline-none resize-none transition-colors"
                placeholder="Escribe las observaciones..."
              />
            ) : (
              <div className="text-text-main bg-white/5 p-4 rounded-xl border border-white/5">
                {visita.descripcion || <span className="italic text-text-muted">Sin observaciones</span>}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-text-muted text-sm font-semibold ml-1">Fotos y Archivos</label>
              {isEditing && (
                <div>
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,video/*"
                  />
                  <Button type="button" variant="outlined" className="!py-1.5 !px-3 text-xs" onClick={() => fileInputRef.current?.click()}>
                    Agregar Archivos
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visita.archivos?.map(archivo => (
                <div key={archivo.id} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                  {archivo.tipo === 'foto' ? (
                    <img src={getApiUrl(archivo.url)} alt="Adjunto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                      <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
                      <span className="text-xs truncate w-11/12 text-center">{archivo.nombre_original}</span>
                    </div>
                  )}
                  <a href={getApiUrl(archivo.url)} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </a>
                </div>
              ))}
              
              {isEditing && archivos.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-brand-blue/10 border border-brand-blue/30">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-brand-blue">
                    <svg className="w-6 h-6 mb-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-9 1h18a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] font-medium truncate w-full">{file.name}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow">
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {(!visita.archivos || visita.archivos.length === 0) && archivos.length === 0 && !isEditing && (
              <div className="text-text-muted italic text-sm">No hay archivos adjuntos.</div>
            )}
          </div>

          {isEditing && (
            <div className="pt-6 flex gap-4 border-t border-white/5 mt-6">
              <Button type="button" variant="outlined" className="flex-1" onClick={() => { setIsEditing(false); setArchivos([]); setDescripcion(visita.descripcion || ''); setError(''); }} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          )}
        </form>
      </GlassCard>

      {/* Tareas de la Visita */}
      <div className="space-y-6">
        <GlassCard padding="p-5">
          <ListaTareas 
            obraId={obraId} 
            visitaId={visitaId} 
            tareas={tareas} 
            onRefresh={() => tareasApi.listarPorObra(obraId, { visita_id: visitaId }).then(setTareas)} 
          />
        </GlassCard>

        {/* Incidencias de la Visita */}
        <GlassCard padding="p-5">
          <ListaIncidencias
            obraId={obraId}
            visitaId={visitaId}
            incidencias={incidencias}
            onRefresh={() => incidenciasApi.listarPorObra(obraId, { visita_id: visitaId }).then(setIncidencias)}
          />
        </GlassCard>
      </div>
    </div>
  );
}
