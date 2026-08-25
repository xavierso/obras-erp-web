'use client';
import { useEffect, useState } from 'react';
import { perfilApi, PerfilEmpresa } from '@/lib/perfilApi';
import { equipoApi, ResumenEquipo } from '@/lib/equipoApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getApiUrl } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { isUserAdmin, RolUsuario } from '@/lib/authApi';

export default function PerfilPage() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [equipo, setEquipo] = useState<ResumenEquipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados del Formulario de Perfil
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [colorPrincipal, setColorPrincipal] = useState('#0B1B32');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Estados del Formulario de Invitación
  const [emailInvitar, setEmailInvitar] = useState('');
  const [rolInvitar, setRolInvitar] = useState<RolUsuario>('INSPECTOR');
  const [invitando, setInvitando] = useState(false);
  const [mensajeInvitacion, setMensajeInvitacion] = useState('');

  const fetchDatos = async () => {
    try {
      const promises: Promise<unknown>[] = [equipoApi.obtenerResumen()];
      if (isUserAdmin(user)) {
        promises.push(perfilApi.obtener());
      }

      const results = await Promise.all(promises);
      const equipoData = results[0] as ResumenEquipo;
      const perfilData = results.length > 1 ? results[1] as PerfilEmpresa : null;

      setEquipo(equipoData);
      
      if (perfilData) {
        setPerfil(perfilData);
        setNombreEmpresa(perfilData.nombre_empresa);
        setColorPrincipal(perfilData.color_principal);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      const actualizado = await perfilApi.actualizar(nombreEmpresa, colorPrincipal, logoFile || undefined);
      setPerfil(actualizado);
      alert('Perfil actualizado con éxito');
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Error al actualizar perfil');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleInvitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvitando(true);
    setMensajeInvitacion('');
    try {
      const token = await equipoApi.invitar(emailInvitar, rolInvitar);
      setMensajeInvitacion(`Invitación creada. Comparte este token temporal con el usuario: ${token}`);
      setEmailInvitar('');
      await fetchDatos(); // Recargar listas
    } catch (err) {
      const error = err as Error;
      setMensajeInvitacion(`Error: ${error.message}`);
    } finally {
      setInvitando(false);
    }
  };

  const handleDarDeBaja = async (id: number) => {
    if (!confirm('¿Estás seguro de dar de baja a este miembro?')) return;
    try {
      await equipoApi.darDeBaja(id);
      await fetchDatos();
    } catch (err) {
      alert('Error al dar de baja');
    }
  };

  if (loading) return <div className="text-center py-10 text-text-muted">Cargando perfil...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Ajustes y Equipo</h1>
        <p className="text-text-muted text-sm">Gestiona la información de la empresa y los accesos</p>
      </div>

      {error && (
        <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECCIÓN PERFIL */}
        {isUserAdmin(user) && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-text-main border-b border-white/10 pb-2">Perfil de Empresa</h2>
            <GlassCard padding="p-6">
              <form onSubmit={handleGuardarPerfil} className="space-y-5">
                <div>
                  <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Nombre de la Empresa</label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent"
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Color Principal (Hex)</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="color"
                      className="w-12 h-12 bg-transparent rounded cursor-pointer"
                      value={colorPrincipal}
                      onChange={(e) => setColorPrincipal(e.target.value)}
                    />
                    <input 
                      type="text"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent font-mono"
                      value={colorPrincipal}
                      onChange={(e) => setColorPrincipal(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Logo de la Empresa</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) setLogoFile(e.target.files[0]);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-main text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-text-main hover:file:bg-white/20"
                  />
                  {perfil?.logo_url && !logoFile && (
                    <div className="mt-3">
                      <img src={getApiUrl(perfil.logo_url)} alt="Logo actual" className="h-16 rounded object-contain bg-white/5 p-1 border border-white/10" />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={guardandoPerfil} className="w-full">
                    {guardandoPerfil ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {/* SECCIÓN EQUIPO */}
        <div className={`space-y-6 ${!isUserAdmin(user) ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-xl font-bold text-text-main border-b border-white/10 pb-2">Gestión de Equipo</h2>
          
          {/* Invitar */}
          <GlassCard padding="p-6">
            <h3 className="font-semibold text-text-main mb-3 text-sm">Invitar a un Miembro</h3>
            <form onSubmit={handleInvitar} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email"
                placeholder="correo@ejemplo.com"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-main text-sm focus:outline-none focus:border-accent"
                value={emailInvitar}
                onChange={(e) => setEmailInvitar(e.target.value)}
                required
              />
              <select
                value={rolInvitar}
                onChange={(e) => setRolInvitar(e.target.value as RolUsuario)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-text-main text-sm focus:outline-none focus:border-accent"
              >
                {isUserAdmin(user) && <option value="DIRECTOR" className="bg-background text-text-main">Director</option>}
                <option value="INSPECTOR" className="bg-background text-text-main">Inspector</option>
                <option value="LECTOR" className="bg-background text-text-main">Lector</option>
              </select>
              <Button type="submit" disabled={invitando} className="px-6 py-2.5 !min-h-0 whitespace-nowrap">
                {invitando ? '...' : 'Invitar'}
              </Button>
            </form>
            {mensajeInvitacion && (
              <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm text-text-main font-mono break-all">
                {mensajeInvitacion}
              </div>
            )}
          </GlassCard>

          {/* Miembros */}
          <GlassCard padding="p-6">
            <h3 className="font-semibold text-text-main mb-4 text-sm">Miembros Activos</h3>
            {equipo?.miembros.length === 0 ? (
              <p className="text-text-muted text-sm">No hay miembros en el equipo.</p>
            ) : (
              <div className="space-y-3">
                {equipo?.miembros.map(miembro => (
                  <div key={miembro.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-text-main">{miembro.nombre}</p>
                      <p className="text-xs text-text-muted">{miembro.email}</p>
                    </div>
                    <button onClick={() => handleDarDeBaja(miembro.id)} className="text-xs text-error hover:underline px-2 py-1">
                      Dar de baja
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
