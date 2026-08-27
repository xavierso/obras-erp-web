'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { documentosApi, CategoriaDocumento, categoriaDocumentoLabels } from '@/lib/documentosApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import Link from 'next/link';

export default function NuevoDocumentoPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  
  const [categoria, setCategoria] = useState<CategoriaDocumento>(CategoriaDocumento.planos);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(obraId)) return;
    if (!archivo) {
      setError('Por favor, selecciona un archivo');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await documentosApi.subir(obraId, categoria, archivo);
      // Tras subirlo volvemos a la obra (donde asumo que podríamos agregar una pestaña de documentos después, pero por ahora volvemos)
      router.push(`/obras/${obraId}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al subir el documento');
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
          <h1 className="text-2xl font-bold text-text-main">Subir Documento</h1>
          <p className="text-text-muted text-sm">Añade un nuevo archivo a la obra</p>
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
            <label htmlFor="categoria" className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Categoría del Documento
            </label>
            <div className="relative z-20">
              <Dropdown
                value={categoria}
                onChange={(val) => setCategoria(val as CategoriaDocumento)}
                fullWidth
                options={Object.entries(categoriaDocumentoLabels).map(([val, label]) => ({
                  value: val,
                  label: label
                }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Archivo a subir (PDF, Imagen, etc.)
            </label>
            
            <div className="relative w-full h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-text-muted bg-white/5 hover:bg-white/10 hover:border-accent transition-all group overflow-hidden">
              <input 
                type="file" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <svg className="w-10 h-10 mb-2 text-brand-blue group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm font-medium text-center px-4">
                {archivo ? archivo.name : 'Haz clic o arrastra un archivo aquí'}
              </p>
              {archivo && (
                <p className="text-xs opacity-70 mt-1">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Link href={`/obras/${obraId}`} className="flex-1">
              <Button type="button" variant="outlined" className="w-full">Cancelar</Button>
            </Link>
            <div className="flex-1">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Subiendo...' : 'Guardar Documento'}
              </Button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
