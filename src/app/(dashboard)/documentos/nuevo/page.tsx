'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { documentosApi, CategoriaDocumento, categoriaDocumentoLabels } from '@/lib/documentosApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import Link from 'next/link';

export default function NuevoDocumentoGlobalPage() {
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState<number | ''>('');
  const [categoria, setCategoria] = useState<CategoriaDocumento>(CategoriaDocumento.planos);
  const [archivo, setArchivo] = useState<File | null>(null);
  
  const [cargandoObras, setCargandoObras] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const data = await obrasApi.listar();
        setObras(data);
      } catch (err: any) {
        setError('Error al cargar las obras disponibles');
      } finally {
        setCargandoObras(false);
      }
    };
    fetchObras();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId) {
      setError('Por favor, selecciona una obra');
      return;
    }
    if (!archivo) {
      setError('Por favor, selecciona un archivo');
      return;
    }
    
    setError('');
    setSubiendo(true);
    
    try {
      await documentosApi.subir(Number(obraId), categoria, archivo);
      router.push('/documentos');
    } catch (err: any) {
      setError(err.message || 'Error al subir el documento');
      setSubiendo(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/documentos" className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Subir Documento</h1>
          <p className="text-text-muted text-sm">Añade un archivo a la biblioteca</p>
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
            <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Obra / Proyecto
            </label>
            <div className="relative">
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-10 text-text-main focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer [color-scheme:dark]"
                value={obraId}
                onChange={(e) => setObraId(e.target.value ? Number(e.target.value) : '')}
                disabled={cargandoObras}
              >
                <option value="" className="bg-surface text-text-main">-- Selecciona una obra --</option>
                {obras.map(obra => (
                  <option key={obra.id} value={obra.id} className="bg-surface text-text-main">
                    {obra.codigo} - {obra.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Categoría
            </label>
            <div className="relative">
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-10 text-text-main focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer [color-scheme:dark]"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
              >
                {Object.entries(categoriaDocumentoLabels).map(([val, label]) => (
                  <option key={val} value={val} className="bg-surface text-text-main">
                    {label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Archivo a subir
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
            <Link href="/documentos" className="flex-1">
              <Button type="button" variant="outlined" className="w-full" disabled={subiendo}>
                Cancelar
              </Button>
            </Link>
            <div className="flex-1">
              <Button type="submit" disabled={subiendo || cargandoObras} className="w-full">
                {subiendo ? 'Subiendo...' : 'Guardar Documento'}
              </Button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
