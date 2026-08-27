'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { citasApi, CitaVisita, EstadoCita, estadoCitaLabels } from '@/lib/citasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import Link from 'next/link';

export default function CitaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const citaId = parseInt(params.id as string, 10);
  
  const [cita, setCita] = useState<CitaVisita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields for rescheduling
  const [editFechaHora, setEditFechaHora] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [editRecordatorio, setEditRecordatorio] = useState('none');
  const [isEditing, setIsEditing] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    const fetchCita = async () => {
      try {
        const data = await citasApi.obtener(citaId);
        setCita(data);
        
        // Initialize editable fields
        // Format for datetime-local: YYYY-MM-DDThh:mm
        const dateObj = new Date(data.fecha_hora);
        const offset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj.getTime() - offset)).toISOString().slice(0, 16);
        
        setEditFechaHora(localISOTime);
        setEditNotas(data.notas || '');
        setEditRecordatorio(data.recordatorio_minutos_antes != null ? data.recordatorio_minutos_antes.toString() : 'none');
        
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al cargar la cita');
      } finally {
        setLoading(false);
      }
    };
    if (!isNaN(citaId)) fetchCita();
  }, [citaId]);

  const handleReprogramar = async () => {
    if (!cita) return;
    setSavingAction(true);
    try {
      const recInt = editRecordatorio === 'none' ? null : parseInt(editRecordatorio, 10);
      const data = await citasApi.reprogramar(cita.id, {
        fecha_hora: new Date(editFechaHora).toISOString(),
        notas: editNotas || null,
        recordatorio_minutos_antes: recInt
      });
      setCita(data);
      setIsEditing(false);
    } catch (err) {
      alert('Error al reprogramar la cita');
    } finally {
      setSavingAction(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoCita) => {
    if (!cita) return;
    setSavingAction(true);
    try {
      const data = await citasApi.cambiarEstado(cita.id, nuevoEstado);
      setCita(data);
    } catch (err) {
      alert('Error al cambiar el estado de la cita');
    } finally {
      setSavingAction(false);
    }
  };

  const handleEliminar = async () => {
    if (!cita) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.')) return;
    setSavingAction(true);
    try {
      await citasApi.eliminar(cita.id);
      router.push('/citas');
    } catch (err) {
      alert('Error al eliminar la cita');
      setSavingAction(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-text-muted">Cargando cita...</div>;
  if (error || !cita) return <div className="text-error text-center p-6">{error || 'Cita no encontrada'}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/citas" className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {cita.nombre_referencia || `Cita para Obra #${cita.obra_id}`}
          </h1>
          <p className="text-text-muted text-sm">Detalles de la cita programada</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Información / Formulario Editable */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-text-main text-lg">
                {isEditing ? 'Modificar Cita' : 'Información'}
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-semibold text-accent hover:underline flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Fecha y Hora</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent"
                      value={editFechaHora}
                      onChange={(e) => setEditFechaHora(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Recordatorio</label>
                    <div className="relative z-20">
                      <Dropdown
                        value={editRecordatorio}
                        onChange={setEditRecordatorio}
                        fullWidth
                        options={[
                          { value: 'none', label: 'Sin recordatorio' },
                          { value: '0', label: 'Al momento exacto' },
                          { value: '30', label: '30 minutos antes' },
                          { value: '180', label: '3 horas antes' },
                          { value: '1440', label: '1 día antes' }
                        ]}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Notas adicionales</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent"
                    value={editNotas}
                    onChange={(e) => setEditNotas(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outlined" onClick={() => {
                    setIsEditing(false);
                    // Reset fields
                    const dateObj = new Date(cita.fecha_hora);
                    const offset = dateObj.getTimezoneOffset() * 60000;
                    setEditFechaHora((new Date(dateObj.getTime() - offset)).toISOString().slice(0, 16));
                    setEditNotas(cita.notas || '');
                    setEditRecordatorio(cita.recordatorio_minutos_antes != null ? cita.recordatorio_minutos_antes.toString() : 'none');
                  }}>Cancelar</Button>
                  <Button onClick={handleReprogramar} disabled={savingAction}>Guardar Cambios</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="block text-text-muted text-xs font-semibold mb-1 uppercase tracking-wider">Fecha Programada</span>
                    <span className="text-text-main font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(cita.fecha_hora).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-text-muted text-xs font-semibold mb-1 uppercase tracking-wider">Recordatorio</span>
                    <span className="text-text-main font-medium">
                      {cita.recordatorio_minutos_antes !== null 
                        ? (cita.recordatorio_minutos_antes === 0 ? 'Al momento' : `${cita.recordatorio_minutos_antes} minutos antes`)
                        : 'No configurado'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-text-muted text-xs font-semibold mb-2 uppercase tracking-wider">Notas / Observaciones</span>
                  {cita.notas ? (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-text-main text-sm whitespace-pre-wrap">
                      {cita.notas}
                    </div>
                  ) : (
                    <span className="text-text-muted text-sm italic">Sin notas adicionales.</span>
                  )}
                </div>

                <div className="pt-2">
                  <span className="block text-text-muted text-xs font-semibold mb-1 uppercase tracking-wider">Creada el</span>
                  <span className="text-text-muted text-xs font-medium">
                    {new Date(cita.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Columna Derecha: Estado y Peligro */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard padding="p-5">
            <h3 className="font-semibold text-text-main mb-4">Estado de la Cita</h3>
            
            <div className="mb-6">
              <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                cita.estado === EstadoCita.pendiente ? 'text-accent bg-accent/10 border-accent/20' : 
                cita.estado === EstadoCita.completada ? 'text-success bg-success/10 border-success/20' : 
                'text-error bg-error/10 border-error/20'
              }`}>
                {estadoCitaLabels[cita.estado]}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-text-muted mb-2">Cambiar estado rápido:</p>
              <div className="grid grid-cols-1 gap-2">
                {cita.estado !== EstadoCita.completada && (
                  <button 
                    onClick={() => handleCambiarEstado(EstadoCita.completada)}
                    disabled={savingAction}
                    className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors text-left"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Marcar Completada
                    </span>
                  </button>
                )}
                {cita.estado !== EstadoCita.cancelada && (
                  <button 
                    onClick={() => handleCambiarEstado(EstadoCita.cancelada)}
                    disabled={savingAction}
                    className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors text-left"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Marcar Cancelada
                    </span>
                  </button>
                )}
                {cita.estado !== EstadoCita.pendiente && (
                  <button 
                    onClick={() => handleCambiarEstado(EstadoCita.pendiente)}
                    disabled={savingAction}
                    className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors text-left"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Marcar Pendiente
                    </span>
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="p-5" className="border-error/30">
            <h3 className="font-semibold text-error mb-2">Zona de Peligro</h3>
            <p className="text-xs text-text-muted mb-4">
              Si eliminas la cita, se borrará del historial de la obra permanentemente.
            </p>
            <button 
              onClick={handleEliminar}
              disabled={savingAction}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-error/5 text-error border border-error/30 hover:bg-error hover:text-white transition-colors"
            >
              Eliminar Cita
            </button>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
