'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { citasApi } from '@/lib/citasApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { Suspense } from 'react';

function NuevaCitaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryObraId = searchParams.get('obraId');
  
  const [obras, setObras] = useState<Obra[]>([]);
  const [tipoVinculo, setTipoVinculo] = useState<'obra' | 'referencia'>('obra');
  const [obraId, setObraId] = useState<string>('');
  const [referencia, setReferencia] = useState('');
  
  // Format for datetime-local: YYYY-MM-DDThh:mm
  const [fechaHora, setFechaHora] = useState('');
  const [notas, setNotas] = useState('');
  const [recordatorio, setRecordatorio] = useState<string>('30'); // 'none', '0', '30', '180', '1440'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If coming from Obra page, pre-fill it
    if (queryObraId) {
      setTipoVinculo('obra');
      setObraId(queryObraId);
    }

    // Load obras to populate the select
    obrasApi.listar().then(setObras).catch(console.error);
    
    // Set default datetime to tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const offset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(tomorrow.getTime() - offset)).toISOString().slice(0, 16);
    setFechaHora(localISOTime);
  }, [queryObraId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tipoVinculo === 'obra' && !obraId) {
      setError('Debes seleccionar una obra');
      return;
    }
    if (tipoVinculo === 'referencia' && !referencia.trim()) {
      setError('Debes escribir una referencia');
      return;
    }
    if (!fechaHora) {
      setError('Debes seleccionar una fecha y hora');
      return;
    }

    // Validación de fecha en el pasado
    const selectedDate = new Date(fechaHora);
    if (selectedDate < new Date()) {
      setError('No puedes programar citas en el pasado');
      return;
    }

    setLoading(true);
    
    try {
      await citasApi.crear({
        obra_id: tipoVinculo === 'obra' ? parseInt(obraId, 10) : null,
        nombre_referencia: tipoVinculo === 'referencia' ? referencia : null,
        fecha_hora: new Date(fechaHora).toISOString(),
        notas: notas || null,
        recordatorio_minutos_antes: recordatorio === 'none' ? null : parseInt(recordatorio, 10)
      });
      toast.success('Cita programada correctamente');
      router.push('/citas');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Error al programar la cita');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/citas" className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Programar Cita</h1>
          <p className="text-text-muted text-sm">Añade una nueva visita o recordatorio</p>
        </div>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-error/20 border border-error/50 text-error rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10">
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tipoVinculo === 'obra' ? 'bg-white/10 text-text-main' : 'text-text-muted hover:text-text-main'}`}
                onClick={() => setTipoVinculo('obra')}
              >
                Vincular a Obra
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${tipoVinculo === 'referencia' ? 'bg-white/10 text-text-main' : 'text-text-muted hover:text-text-main'}`}
                onClick={() => setTipoVinculo('referencia')}
              >
                Visita Potencial Libre
              </button>
            </div>

            {tipoVinculo === 'obra' ? (
              <div>
                <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Seleccionar Obra *</label>
                <div className="relative z-30">
                  <Dropdown
                    value={obraId}
                    onChange={setObraId}
                    placeholder="-- Selecciona una obra --"
                    fullWidth
                    options={[
                      { value: '', label: '-- Selecciona una obra --' },
                      ...obras.map(o => ({ value: o.id.toString(), label: `${o.codigo} - ${o.nombre}` }))
                    ]}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Nombre / Referencia *</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-main focus:outline-none focus:border-accent placeholder:text-text-muted/50"
                  placeholder="Ej: Visita presupuesto familia Pérez"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  required={tipoVinculo === 'referencia'}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Fecha y Hora *</label>
              <input 
                type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-text-muted text-sm font-semibold mb-2 ml-1">Recordatorio</label>
              <div className="relative z-20">
                <Dropdown
                  value={recordatorio}
                  onChange={setRecordatorio}
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
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent placeholder:text-text-muted/50"
              placeholder="Detalles sobre lo que se debe revisar..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <Link href="/citas" className="flex-1">
              <Button type="button" variant="outlined" className="w-full">Cancelar</Button>
            </Link>
            <div className="flex-1">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Guardando...' : 'Programar Cita'}
              </Button>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

export default function NuevaCitaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Cargando...</div>}>
      <NuevaCitaForm />
    </Suspense>
  );
}
