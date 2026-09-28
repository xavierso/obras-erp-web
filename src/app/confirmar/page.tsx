'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/authApi';
import { Button } from '@/components/ui/Button';

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [estado, setEstado] = useState<'cargando' | 'exito' | 'error'>('cargando');
  const [mensaje, setMensaje] = useState('Verificando tu cuenta...');

  useEffect(() => {
    if (!token) {
      setEstado('error');
      setMensaje('No se ha proporcionado ningún token de verificación.');
      return;
    }

    const confirmar = async () => {
      try {
        await authApi.confirmarEmail(token);
        setEstado('exito');
        setMensaje('¡Tu cuenta ha sido verificada con éxito! Ya puedes iniciar sesión.');
      } catch (err: any) {
        setEstado('error');
        setMensaje(err.message || 'El enlace de verificación no es válido o ha expirado.');
      }
    };

    confirmar();
  }, [token]);

  return (
    <div className="bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Verificación de Cuenta</h1>
        <p className="text-text-muted">{mensaje}</p>
      </div>

      <div className="flex justify-center mt-8">
        <Button onClick={() => router.push('/login')} className="w-full md:w-auto" variant={estado === 'error' ? 'outlined' : 'primary'}>
          Ir a Iniciar Sesión
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-surface-2 to-background -z-20"></div>
      
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center text-text-muted">Cargando...</div>}>
          <ConfirmarContent />
        </Suspense>
      </div>
    </main>
  );
}
