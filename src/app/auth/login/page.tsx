'use client';
import { useState } from 'react';
import { authApi } from '@/lib/authApi';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const token = await authApi.login(email, password);
      await login(token);
    } catch (error) {
      const err = error as Error;
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-background">
      {/* Imagen de fondo segura */}
      <img 
        src="/login-bg.jpg"
        alt="DIAM Background"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-40"
      />
      
      {/* Overlay azul oscuro sutil */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-background/90 via-background/60 to-[#032C4F]/60" />
      
      <div className="w-full max-w-[380px] relative z-20">
        <div className="relative overflow-hidden bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl rounded-[40px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-8 sm:p-10">
          {/* Top Glow Effect */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[150%] h-64 bg-[#00509E]/50 blur-[60px] rounded-full pointer-events-none" />
          
          <form onSubmit={handleLogin} className="relative z-10">
            <div className="text-center mb-8 flex flex-col items-center">
              <img src="/logo-diam.png" alt="DIAM Logo" className="h-28 w-auto mb-1 object-contain drop-shadow-2xl scale-125" />
              <p className="text-white/60 text-sm font-medium tracking-wide">Ingresa a tu cuenta</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-white/70 text-xs font-semibold mb-2 ml-1">Email</label>
                <input 
                  id="email"
                  type="email"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/30"
                  placeholder="ejemplo@diam.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-white/70 text-xs font-semibold mb-2 ml-1">Contraseña</label>
                <input 
                  id="password"
                  type="password"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/30 tracking-widest"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <button 
                type="submit" 
                className="w-full bg-white text-[#020D1A] font-bold text-sm rounded-full py-4 hover:bg-gray-100 hover:scale-[1.02] active:scale-100 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
              >
                Ingresar
              </button>
              
              <div className="flex items-center justify-center space-x-4 py-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-white/40 text-xs font-medium uppercase tracking-wider">O</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div className="text-center">
                <Link href="/auth/register" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                  ¿No tienes cuenta? <span className="text-white underline decoration-white/30 underline-offset-4">Regístrate</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
