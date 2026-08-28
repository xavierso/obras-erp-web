'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { obrasApi } from '@/lib/obrasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function NuevaObraPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const nuevaObra = await obrasApi.crear(nombre, cliente, direccion);
      router.replace(`/obras/${nuevaObra.id}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al crear la obra');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/obras" className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Nueva Obra</h1>
          <p className="text-text-muted text-sm">Registra un nuevo proyecto</p>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="nombre" className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Nombre de la Obra *
            </label>
            <input 
              id="nombre"
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
              placeholder="Ej. Edificio Torre Norte"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="cliente" className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Cliente (Opcional)
            </label>
            <input 
              id="cliente"
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
              placeholder="Nombre del cliente o empresa"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="direccion" className="block text-text-muted text-sm font-semibold mb-2 ml-1">
              Dirección (Opcional)
            </label>
            <input 
              id="direccion"
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
              placeholder="Ubicación de la obra"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <Link href="/obras" className="flex-1">
              <Button type="button" variant="outlined" className="w-full">Cancelar</Button>
            </Link>
            <div className="flex-1">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creando...' : 'Crear Obra'}
              </Button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
