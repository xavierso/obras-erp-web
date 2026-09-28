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
      ...(isUserAdmin(user) || isUserDirector(user) ? [{ name: 'Presupuestos', href: '/presupuestos', icon: FileText }] : []),
    ];
  };

  const navLinks = getNavLinks();
  
  // Nav links computed directly in render for mobile

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar Wrapper for floating effect */}
      <div className="hidden lg:flex flex-col py-6 pl-6 z-20">
        <aside className={`flex flex-col bg-surface border border-white/10 rounded-[28px] h-full shadow-[0_28px_60px_rgba(12,26,44,0.32)] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] relative py-[34px] ${
          isSidebarCollapsed ? 'w-[98px]' : 'w-[300px]'
        }`}>
          {/* Toggle Button */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-[22px] top-8 w-[26px] h-[50px] bg-surface border-y border-r border-white/10 rounded-r-[12px] flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer z-50"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" strokeWidth={2.5} /> : <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />}
          </button>

          {/* Top Section: Logo */}
          <div className="flex items-center min-h-[44px] px-8 mb-6 relative">
            <div className="flex-shrink-0 flex items-center justify-center w-[38px] h-[38px]">
              <img 
                src="/logo-diam.png" 
                alt="DIAM" 
                className="w-full h-full object-contain drop-shadow-md" 
              />
            </div>
            <span className={`absolute left-[84px] text-[26px] font-bold text-white whitespace-nowrap tracking-tight transition-opacity duration-300 ${
              isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              Obras ERP
            </span>
          </div>

          {/* Profile Section */}
          {user && (
            <div className={`flex flex-col items-center flex-shrink-0 transition-all duration-400 mb-6 px-[18px] ${
              isSidebarCollapsed ? 'h-[40px]' : 'h-[120px]'
            }`}>
              <div className={`rounded-full bg-surface-2 flex items-center justify-center border border-white/10 transition-all duration-400 overflow-hidden shadow-sm ${
                isSidebarCollapsed ? 'w-[40px] h-[40px]' : 'w-[68px] h-[68px]'
              }`}>
                <span className={`font-bold text-brand-blue ${isSidebarCollapsed ? 'text-lg' : 'text-3xl'}`}>
                  {user.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className={`flex flex-col items-center text-center mt-3 transition-opacity duration-300 ${
                isSidebarCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'
              }`}>
                <p className="text-[17px] font-semibold text-white whitespace-nowrap">{user.nombre}</p>
                <p className="text-[12px] text-text-muted whitespace-nowrap mt-0.5 max-w-[240px] truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto custom-scrollbar">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`relative flex items-center gap-[14px] h-[52px] mx-[16px] px-[16px] rounded-[12px] transition-all duration-250 group ${
                    isActive 
                      ? 'bg-brand-blue/10 text-white' 
                      : 'bg-transparent text-text-muted hover:text-white'
                  }`}
                  title={isSidebarCollapsed ? link.name : undefined}
                >
                  {isActive && (
                    <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-brand-blue rounded-r-md transition-all duration-300" />
                  )}
                  <Icon className={`flex-shrink-0 transition-colors duration-250 ${
                    isActive ? 'text-brand-blue w-5 h-5' : 'w-5 h-5'
                  }`} strokeWidth={isActive ? 2.5 : 2} />
                  
                  <span className={`text-[15px] font-medium whitespace-nowrap transition-opacity duration-300 ${
                    isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'
                  }`}>
                    {link.name}
                  </span>
                </Link>
              )
            })}
          </nav>

          {user && (
            <div className="mt-auto pt-[20px]">
              <button 
                onClick={logout}
                className="relative flex items-center gap-[16px] h-[64px] mx-[18px] px-[20px] rounded-[14px] transition-all duration-250 group bg-transparent text-text-muted hover:text-error hover:bg-error/10 w-[calc(100%-36px)]"
                title={isSidebarCollapsed ? "Cerrar sesión" : undefined}
              >
                <LogOut className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                <span className={`text-[17px] font-medium whitespace-nowrap transition-opacity duration-300 ${
                  isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'
                }`}>
                  Salir
                </span>
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 custom-scrollbar relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-brand-navy/30 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="p-4 md:p-10 max-w-6xl mx-auto pt-16 md:pt-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 z-50 pointer-events-none">
        <GlassCard padding="p-2" className="flex justify-between items-center rounded-2xl pointer-events-auto shadow-2xl shadow-black/50 border-t border-white/10 relative">
          {navLinks.filter(l => ['Inicio', 'Obras'].includes(l.name)).map((link) => {
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
                <div 
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm pointer-events-auto"
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
                  {(isUserAdmin(user) || isUserDirector(user)) && (
                    <>
                      <Link href="/citas" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                        <CalendarDays className="w-4 h-4 text-warning" />
                        Citas
                      </Link>
                      <Link href="/visitas" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                        <MapPin className="w-4 h-4 text-success" />
                        Visitas
                      </Link>
                      <Link href="/documentos" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                        <FileText className="w-4 h-4 text-text-muted" />
                        Documentos
                      </Link>
                      <Link href="/presupuestos" onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-sm text-text-main hover:bg-white/5 border-b border-white/5 transition-colors">
                        <FileText className="w-4 h-4 text-brand-blue" />
                        Presupuestos
                      </Link>
                    </>
                  )}
                  <button onClick={() => { setIsFabOpen(false); logout(); }} className="flex items-center gap-3 px-4 py-3.5 text-sm text-error hover:bg-error/10 transition-colors w-full text-left">
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
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

          {(() => {
            const rightLinks = [
              navLinks.find(l => l.name === 'Calendario'),
              (isUserAdmin(user) || isUserDirector(user)) ? navLinks.find(l => l.name === 'Equipo') : navLinks.find(l => l.name === 'Tareas')
            ].filter(Boolean) as any[];

            return rightLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.href !== '#' && pathname.startsWith(link.href);
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
            });
          })()}
        </GlassCard>
      </div>
    </div>
  );
}
