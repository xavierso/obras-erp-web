import React, { useState } from 'react';
import { Visita, VisitaArchivo } from '@/lib/visitasApi';

interface GaleriaVisitasProps {
  visitas: Visita[];
}

export function GaleriaVisitas({ visitas }: GaleriaVisitasProps) {
  const [selectedFoto, setSelectedFoto] = useState<{ url: string; fecha: string; nombre: string } | null>(null);

  // Extraer todas las fotos de todas las visitas
  const fotos = visitas.flatMap(v => 
    v.archivos
      .filter(a => a.tipo === 'foto')
      .map(a => ({
        url: a.url,
        nombre: a.nombre_original,
        fecha: v.fecha
      }))
  ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Helper para construir URLs absolutas para las imágenes
  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
  };

  if (fotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface/20 border border-white/5 rounded-xl text-center">
        <svg className="w-12 h-12 text-text-muted mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-text-muted text-sm">No hay fotografías registradas en las visitas de esta obra.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
        {fotos.map((foto, idx) => (
          <div 
            key={idx} 
            className="group relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 cursor-pointer hover:border-brand-blue/50 transition-all shadow-md"
            onClick={() => setSelectedFoto(foto)}
          >
            <img 
              src={getImageUrl(foto.url)} 
              alt={foto.nombre}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <span className="text-[10px] text-brand-blue font-bold tracking-wider uppercase">
                {new Date(foto.fecha).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedFoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <button 
            className="absolute top-12 right-4 md:top-6 md:right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-[110]"
            onClick={() => setSelectedFoto(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative max-w-5xl max-h-screen flex flex-col items-center">
            <img 
              src={getImageUrl(selectedFoto.url)} 
              alt={selectedFoto.nombre}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-semibold text-lg">{new Date(selectedFoto.fecha).toLocaleDateString()}</p>
              <p className="text-text-muted text-sm">{selectedFoto.nombre}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
