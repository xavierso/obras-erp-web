'use client';
import { useState } from 'react';
import { authApi } from '@/lib/authApi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.registrar(email, nombre, password);
      router.push('/auth/login?registered=true');
    } catch (error) {
      const err = error as Error;
      setError(err.message || 'Error al registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm relative z-10">
        <GlassCard>
          <form onSubmit={handleRegister}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-text-main mb-2">Crear Cuenta</h1>
              <p className="text-text-muted text-sm">Únete a OBRAS ERP</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="nombre" className="block text-text-muted text-sm font-semibold mb-2 ml-1">Nombre completo</label>
                <input 
                  id="nombre"
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
                  placeholder="Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-text-muted text-sm font-semibold mb-2 ml-1">Email</label>
                <input 
                  id="email"
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
                  placeholder="ejemplo@diam.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-text-muted text-sm font-semibold mb-2 ml-1">Contraseña</label>
                <input 
                  id="password"
                  type="password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted/50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </Button>
              <div className="text-center">
                <Link href="/auth/login" className="text-sm font-medium text-text-muted hover:text-accent transition-colors">
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
              </div>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
