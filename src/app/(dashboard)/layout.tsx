'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { isUserAdmin, isUserDirector } from '@/lib/authApi';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  const navLinks = [
    ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Inicio', href: '/home' }] : []),
    { name: 'Calendario', href: '/calendario' },
    { name: 'Obras', href: '/obras' },
    { name: 'Tareas', href: '/tareas' },
    { name: 'Incidencias', href: '/incidencias' },
    ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Citas', href: '/citas' }] : []),
    ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Visitas', href: '/visitas' }] : []),
    ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Docs', href: '/documentos' }] : []),
    ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Equipo', href: '/perfil' }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 p-6">
        <h2 className="text-xl font-bold text-accent mb-8">OBRAS ERP</h2>
        <nav className="flex-1 space-y-2">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="block p-3 rounded-xl text-text-muted hover:text-text-main hover:bg-white/5 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="mt-auto pt-4 border-t border-white/10">
            <p className="text-sm font-semibold text-text-main">{user.nombre}</p>
            <p className="text-xs text-text-muted mb-3 truncate">{user.email}</p>
            <button 
              onClick={logout}
              className="text-sm text-error hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (hidden on md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 z-50">
        <GlassCard padding="p-2" className="flex justify-around items-center rounded-2xl">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="flex flex-col items-center p-2 text-text-muted hover:text-accent transition-colors text-xs"
            >
              <span className="font-medium mt-1">{link.name}</span>
            </Link>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}
