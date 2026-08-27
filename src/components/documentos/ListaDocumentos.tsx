import React, { useState } from 'react';
import { Documento, categoriaDocumentoLabels, documentosApi, CategoriaDocumento } from '@/lib/documentosApi';
import { getApiUrl } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import Link from 'next/link';

interface ListaDocumentosProps {
  obraId: number;
  documentos: Documento[];
  onRefresh: () => void;
}

export function ListaDocumentos({ obraId, documentos, onRefresh }: ListaDocumentosProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaDocumento | ''>('');

  const docsFiltrados = filtroCategoria 
    ? documentos.filter(d => d.categoria === filtroCategoria)
    : documentos;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-text-main">Documentación ({documentos.length})</h3>
        <Link href={`/obras/${obraId}/documentos/nuevo`}>
          <Button fullWidth={false} className="!min-h-[32px] px-3 py-1.5 text-xs">
            Subir Documento
          </Button>
        </Link>
      </div>

      <div className="mb-4 relative w-fit z-20">
        <Dropdown
          value={filtroCategoria}
          onChange={(val) => setFiltroCategoria(val as CategoriaDocumento | '')}
          placeholder="Todas las categorías"
          options={[
            { value: '', label: 'Todas las categorías' },
            ...Object.entries(categoriaDocumentoLabels).map(([val, label]) => ({
              value: val,
              label: label
            }))
          ]}
        />
      </div>

      {docsFiltrados.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm py-8">
          No hay documentos {filtroCategoria ? 'de esta categoría' : 'subidos'}.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
          {docsFiltrados.map((doc) => (
            <div key={doc.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:border-accent/30 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate" title={doc.nombre_original}>
                    {doc.nombre_original}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-text-muted">
                      {categoriaDocumentoLabels[doc.categoria]}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <a href={getApiUrl(doc.url)} target="_blank" rel="noreferrer" className="shrink-0 p-1 text-text-muted hover:text-accent transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
