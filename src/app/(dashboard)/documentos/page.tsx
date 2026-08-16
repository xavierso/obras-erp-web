'use client';
import { useEffect, useState } from 'react';
import { documentosApi, DocumentoConObra, CategoriaDocumento, categoriaDocumentoLabels } from '@/lib/documentosApi';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiClient';

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<DocumentoConObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaDocumento | ''>('');

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const data = await documentosApi.listarTodos(filtroCategoria ? filtroCategoria : undefined);
        setDocumentos(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al cargar documentos');
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [filtroCategoria]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Documentos</h1>
          <p className="text-text-muted text-sm">Biblioteca global de la empresa</p>
        </div>
        
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value as CategoriaDocumento | '')}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-main text-sm focus:outline-none focus:border-accent"
        >
          <option value="" className="bg-bg-deep">Todas las categorías</option>
          {Object.entries(categoriaDocumentoLabels).map(([val, label]) => (
            <option key={val} value={val} className="bg-bg-deep text-text-main">{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-text-muted">Cargando documentos...</div>
      ) : documentos.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-text-muted">No se encontraron documentos.</p>
        </GlassCard>
      ) : (
        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs text-text-muted">
                  <th className="p-4 font-semibold">Archivo</th>
                  <th className="p-4 font-semibold">Categoría</th>
                  <th className="p-4 font-semibold">Obra</th>
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documentos.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-text-main truncate max-w-[200px] md:max-w-[300px]">
                          {doc.nombre_original}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-white/10 px-2 py-1 rounded text-text-muted">
                        {categoriaDocumentoLabels[doc.categoria]}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/obras/${doc.obra_id}`} className="text-sm text-text-main hover:text-accent truncate max-w-[150px] inline-block">
                        {doc.obra_nombre}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <a href={getApiUrl(doc.url)} target="_blank" rel="noreferrer" className="inline-flex items-center text-accent hover:text-accent-light text-sm font-medium transition-colors">
                        Abrir
                        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
