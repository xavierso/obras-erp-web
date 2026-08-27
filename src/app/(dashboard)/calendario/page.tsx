'use client';
import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { calendarioApi, EventoCalendarioOut } from '@/lib/calendarioApi';
import { CalendarioVistaMes } from '@/components/calendario/CalendarioVistaMes';
import { CalendarioAgenda } from '@/components/calendario/CalendarioAgenda';
import Link from 'next/link';

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<EventoCalendarioOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'mes' | 'agenda'>('mes');
  
  const [fechaActual, setFechaActual] = useState(new Date());
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const data = await calendarioApi.listar(
        filtroTipo !== 'todos' ? { tipos: [filtroTipo] } : undefined
      );
      setEventos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [filtroTipo]);

  const prevMes = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  };
  const nextMes = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  };
  const goHoy = () => {
    setFechaActual(new Date());
  };

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Calendario</h1>
          <p className="text-text-muted text-sm">Motor temporal de la aplicación</p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/calendario/nuevo">
            <Button fullWidth={false} className="!min-h-[40px] px-4 py-2 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Actividad
            </Button>
          </Link>
        </div>
      </div>

      <GlassCard padding="p-4" className="flex flex-col md:flex-row gap-4 items-center justify-between relative z-10">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Button variant="outlined" onClick={prevMes} className="!py-1.5 !px-3">&lt;</Button>
          <span className="font-bold text-lg min-w-[120px] text-center">
            {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
          </span>
          <Button variant="outlined" onClick={nextMes} className="!py-1.5 !px-3">&gt;</Button>
          <Button variant="outlined" onClick={goHoy} className="!py-1.5 !px-3 ml-2">Hoy</Button>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto pb-1 md:pb-0">
          <Dropdown 
            value={filtroTipo}
            onChange={setFiltroTipo}
            options={[
              { value: 'todos', label: 'Todos los eventos' },
              { value: 'visita', label: 'Visitas', color: 'bg-brand-blue' },
              { value: 'tarea', label: 'Tareas', color: 'bg-yellow-500' },
              { value: 'incidencia', label: 'Incidencias', color: 'bg-error' },
              { value: 'hito', label: 'Hitos', color: 'bg-purple-500' },
              { value: 'reunion', label: 'Reuniones', color: 'bg-gray-200' },
              { value: 'entrega', label: 'Entregas', color: 'bg-green-500' }
            ]}
          />

          <div className="flex bg-white/5 rounded-xl p-1 shrink-0">
            <button 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${vista === 'mes' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setVista('mes')}
            >
              Mes
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${vista === 'agenda' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-main'}`}
              onClick={() => setVista('agenda')}
            >
              Agenda
            </button>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="text-center py-20 text-text-muted">Cargando eventos...</div>
      ) : (
        <GlassCard padding="p-4 md:p-6" className="min-h-[500px]">
          {vista === 'mes' ? (
            <div className="hidden md:block">
              <CalendarioVistaMes 
                mes={fechaActual.getMonth() + 1} 
                anio={fechaActual.getFullYear()} 
                eventos={eventos} 
              />
            </div>
          ) : null}
          
          {vista === 'mes' && (
            <div className="md:hidden">
              <div className="mb-4 text-xs text-brand-blue font-semibold text-center bg-brand-blue/10 py-2 rounded-lg">
                La vista mensual está optimizada para escritorio. Mostrando agenda.
              </div>
              <CalendarioAgenda eventos={eventos} />
            </div>
          )}

          {vista === 'agenda' && (
             <CalendarioAgenda eventos={eventos} />
          )}
        </GlassCard>
      )}
    </div>
  );
}
