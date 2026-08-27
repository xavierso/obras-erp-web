'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { calendarioApi } from '@/lib/calendarioApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { isUserLector } from '@/lib/authApi';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function NuevaActividadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    tipo: 'hito', // hito, reunion, entrega
    titulo: '',
    descripcion: '',
    obra_id: '',
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fin: ''
  });

  useEffect(() => {
    if (isUserLector(user)) {
      router.push('/calendario');
      return;
    }
    obrasApi.listar().then(setObras).catch(console.error);
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Si elige Visita, Tarea o Incidencia, debe redirigirse al módulo correspondiente.
    // Esto se maneja en el formulario visualmente, pero por seguridad validamos aquí.
    if (['visita', 'tarea', 'incidencia'].includes(formData.tipo)) {
      if (formData.tipo === 'visita') router.push('/visitas');
      if (formData.tipo === 'tarea') router.push('/tareas');
      if (formData.tipo === 'incidencia') router.push('/incidencias');
      return;
    }

    try {
      await calendarioApi.crear({
        tipo: formData.tipo as any,
        titulo: formData.titulo,
        descripcion: formData.descripcion || undefined,
        obra_id: formData.obra_id ? parseInt(formData.obra_id) : undefined,
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio ? `${formData.hora_inicio}:00` : undefined,
        hora_fin: formData.hora_fin ? `${formData.hora_fin}:00` : undefined,
      });
      router.push('/calendario');
    } catch (err: any) {
      setError(err.message || 'Error al guardar la actividad');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => router.back()} className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Nueva Actividad</h1>
          <p className="text-text-muted text-sm">Crear un hito, reunión o entrega en el calendario</p>
        </div>
      </div>

      <GlassCard padding="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Tipo de Actividad</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'hito', label: '🟣 Hito' },
                  { value: 'reunion', label: '⚪ Reunión' },
                  { value: 'entrega', label: '🟢 Entrega' }
                ].map(tipo => (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: tipo.value })}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors
                      ${formData.tipo === tipo.value ? 'bg-accent/20 border-accent text-accent' : 'bg-white/5 border-white/10 text-text-main hover:border-white/30'}
                    `}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-xs text-text-muted flex gap-2 items-start">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Para crear una Visita, Tarea o Incidencia, hazlo desde sus respectivos módulos para mantener la integridad de los datos.</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Título *</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent"
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej. Entrega de llaves, Inicio de cimentación..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Obra (Opcional)</label>
                <Dropdown
                  value={formData.obra_id}
                  onChange={val => setFormData({ ...formData, obra_id: val })}
                  placeholder="-- General / Oficina --"
                  fullWidth
                  options={[
                    { value: '', label: '-- General / Oficina --' },
                    ...obras.map(o => ({ value: o.id.toString(), label: o.nombre }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent [color-scheme:dark]"
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Hora inicio (Opcional)</label>
                <input
                  type="time"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent [color-scheme:dark]"
                  value={formData.hora_inicio}
                  onChange={e => setFormData({ ...formData, hora_inicio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Hora fin (Opcional)</label>
                <input
                  type="time"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent [color-scheme:dark]"
                  value={formData.hora_fin}
                  onChange={e => setFormData({ ...formData, hora_fin: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Descripción</label>
              <textarea
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent resize-none"
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="outlined" fullWidth={false} onClick={() => router.back()} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth={false} disabled={loading}>
              Crear Actividad
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
