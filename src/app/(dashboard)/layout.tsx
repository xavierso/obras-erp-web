'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { isUserAdmin, isUserDirector } from '@/lib/authApi';
import { 
  Home, 
  Calendar, 
  Briefcase, 
  CheckSquare, 
  AlertTriangle, 
  CalendarDays, 
  MapPin, 
  FileText, 
  Users,
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getNavLinks = () => {
    return [
      { name: 'Inicio', href: '/home', icon: Home },
      { name: 'Obras', href: '/obras', icon: Briefcase },
      { name: 'Tareas', href: '/tareas', icon: CheckSquare },
      { name: 'Incid', href: '/incidencias', icon: AlertTriangle },
      { name: 'Calendario', href: '/calendario', icon: Calendar },
      ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Citas', href: '/citas', icon: CalendarDays }] : []),
      ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Visitas', href: '/visitas', icon: MapPin }] : []),
      ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Docs', href: '/documentos', icon: FileText }] : []),
      ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Equipo', href: '/perfil', icon: Users }] : []),
    ];
  };

  const navLinks = getNavLinks();
  
  // Mobile nav shows fewer items to fit the bottom bar
  const mobileLinks = navLinks.filter(l => ['Inicio', 'Obras', 'Calendario', 'Equipo'].includes(l.name));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-surface border-r border-white/5 py-6 z-20 transition-all duration-300 relative ${
        isSidebarCollapsed ? 'w-24 px-4 items-center' : 'w-72 px-6'
      }`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-4 top-10 w-8 h-8 rounded-full bg-brand-blue border-[3px] border-background flex items-center justify-center text-white hover:bg-brand-blue-light transition-colors shadow-md z-50 cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" strokeWidth={3} /> : <ChevronLeft className="w-4 h-4" strokeWidth={3} />}
        </button>

        <div className={`flex items-center transition-all duration-300 ${
          isSidebarCollapsed ? 'justify-center h-16 mt-2 mb-6' : 'justify-center h-20 w-full mt-2 mb-2'
        }`}>
          <img 
            src="/logo-diam.png" 
            alt="DIAM Logo" 
            className={`object-contain transition-all duration-300 ${
              isSidebarCollapsed ? 'h-14 w-auto drop-shadow-md' : 'h-[230px] w-auto drop-shadow-lg ml-2 -my-20'
            }`} 
          />
        </div>
        
        <nav className="flex-1 space-y-2 w-full pt-8">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                  isSidebarCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 w-full'
                } ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-navy to-transparent border-l-2 border-brand-blue text-text-main shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' 
                    : 'text-text-muted hover:text-text-main hover:bg-white/5 border-l-2 border-transparent'
                }`}
                title={isSidebarCollapsed ? link.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-blue' : 'text-text-muted opacity-80'}`} strokeWidth={isActive ? 2.5 : 2} />
                {!isSidebarCollapsed && (
                  <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'} whitespace-nowrap overflow-hidden`}>{link.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {user && (
          <div className="mt-auto pt-6 border-t border-white/5 w-full">
            <div className={`glass-panel rounded-xl flex items-center ${
              isSidebarCollapsed ? 'p-2 justify-center' : 'p-4 gap-3'
            }`}>
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-surface-2 flex items-center justify-center border border-white/10">
                <span className="text-sm font-bold text-brand-blue">
                  {user.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isSidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">{user.nombre}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 flex-shrink-0 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 custom-scrollbar relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-brand-navy/30 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="p-4 md:p-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 z-50 pointer-events-none">
        <GlassCard padding="p-2" className="flex justify-between items-center rounded-2xl pointer-events-auto shadow-2xl shadow-black/50 border-t border-white/10 relative">
          {mobileLinks.slice(0, 2).map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                  isActive ? 'text-brand-blue' : 'text-text-muted'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-brand-blue' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
          
          {/* Main Action Button (FAB) */}
          <div className="relative -top-6 flex flex-col items-center">
            {/* FAB Menu */}
            {isFabOpen && (
              <>
                {/* Backdrop invisible para cerrar al tocar fuera */}
                <div 
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                  onClick={() => setIsFabOpen(false)}
                />
                <div className="absolute bottom-16 mb-4 w-48 bg-surface-2 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <Link href="/tareas" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                    <CheckSquare className="w-4 h-4 text-brand-blue" />
                    Tareas
                  </Link>
                  <Link href="/incidencias" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    Incidencias
                  </Link>
                  <Link href="/citas" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                    <CalendarDays className="w-4 h-4 text-warning" />
                    Citas
                  </Link>
                  <Link href="/visitas" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                    <MapPin className="w-4 h-4 text-success" />
                    Visitas
                  </Link>
                  <Link href="/documentos" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 transition-colors">
                    <FileText className="w-4 h-4 text-text-muted" />
                    Documentos
                  </Link>
                </div>
              </>
            )}

            <button 
              onClick={() => setIsFabOpen(!isFabOpen)}
              className={`relative z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-brand-navy to-brand-blue flex items-center justify-center shadow-[0_8px_30px_rgba(15,66,126,0.6)] border border-brand-blue-light/50 text-white transition-all duration-300 ${isFabOpen ? 'rotate-45 scale-110 shadow-brand-blue/50' : 'hover:scale-105'}`}
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          {mobileLinks.slice(2, 4).map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                  isActive ? 'text-brand-blue' : 'text-text-muted'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-brand-blue' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </GlassCard>
      </div>
    </div>
  );
}
