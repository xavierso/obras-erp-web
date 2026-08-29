'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authApi, Usuario } from '@/lib/authApi';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const perfil = await authApi.obtenerPerfilPropio();
      setUser(perfil);
    } catch (error) {
      // Si es un 401, el token caducó o es inválido. No imprimimos error para que Next.js Turbopack
      // no muestre la pantalla roja gigante por un simple logout forzado.
      Cookies.remove('token');
      setUser(null);
      router.push('/auth/login');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('token');
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (token: string) => {
    Cookies.set('token', token, { expires: 7 }); // expira en 7 días
    await refreshUser();
    router.push('/home');
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
