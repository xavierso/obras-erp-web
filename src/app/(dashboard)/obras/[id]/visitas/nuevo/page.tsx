'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { visitasApi } from '@/lib/visitasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function NuevaVisitaPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  
  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(obraId)) return;
    
    setError('');
    setLoading(true);
    
    try {
      await visitasApi.crear(obraId, descripcion, archivos);
      router.push(`/obras/${obraId}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al registrar la visita');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link href={`/obras/${obraId}`} className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Registrar Visita</h1>
          <p className="text-text-muted text-sm">Añade fotos o videos del progreso</p>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="descripcion" className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Observaciones
            </label>
            <textarea 
              id="descripcion"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
              placeholder="¿Qué avances hubo hoy? ¿Hubo algún problema?"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Evidencia (Fotos / Videos)
            </label>
            
            {/* Contenedor estilo Dropzone que abre la cámara en móviles */}
            <div className="relative w-full h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-text-muted bg-white/5 hover:bg-white/10 hover:border-accent transition-all group overflow-hidden">
              <input 
                type="file" 
                multiple
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <svg className="w-10 h-10 mb-2 text-brand-blue group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-medium">Toca para abrir la cámara o galería</p>
              <p className="text-xs opacity-70 mt-1">{archivos.length} archivos seleccionados</p>
            </div>
            
            {archivos.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {archivos.map((file, idx) => (
                  <div key={idx} className="bg-white/10 px-3 py-1.5 rounded-md text-xs text-text-main flex items-center">
                    <svg className="w-4 h-4 mr-1 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="truncate max-w-[120px]">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <Link href={`/obras/${obraId}`} className="flex-1">
              <Button type="button" variant="outlined" className="w-full">Cancelar</Button>
            </Link>
            <div className="flex-1">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Subiendo...' : 'Guardar Visita'}
              </Button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
