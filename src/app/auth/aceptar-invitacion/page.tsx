'use client';
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/authApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import Cookies from 'js-cookie';

export default function AceptarInvitacionPage() {
  const [token, setToken] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Si viene el token en la URL (?token=abc), lo pre-rellenamos
    const tokenUrl = searchParams.get('token');
    if (tokenUrl) {
      setToken(tokenUrl);
    }
  }, [searchParams]);

  const handleAceptar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const jwtToken = await authApi.aceptarInvitacion(token, nombre, password);
      Cookies.set('token', jwtToken, { expires: 1, path: '/' });
      router.push('/home');
    } catch (error) {
      const err = error as Error;
      setError(err.message || 'Error al aceptar la invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-main mb-2">Unirse al Equipo</h1>
          <p className="text-text-muted">Introduce tu token de invitación y crea tu cuenta</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAceptar} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Token de Invitación
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-white/20 focus:outline-none focus:border-accent"
              placeholder="Ej: ABC123XYZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Tu Nombre
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-white/20 focus:outline-none focus:border-accent"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-white/20 focus:outline-none focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Unirse ahora'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
