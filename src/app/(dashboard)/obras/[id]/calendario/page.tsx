'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { calendarioApi, EventoCalendarioOut } from '@/lib/calendarioApi';
import { obrasApi, Obra } from '@/lib/obrasApi';
import { CalendarioVistaMes } from '@/components/calendario/CalendarioVistaMes';
import { CalendarioAgenda } from '@/components/calendario/CalendarioAgenda';

export default function ObraCalendarioPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string, 10);
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [eventos, setEventos] = useState<EventoCalendarioOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'mes' | 'agenda'>('mes');
  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    if (isNaN(obraId)) return;
    
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const [obraData, eventosData] = await Promise.all([
          obrasApi.obtener(obraId),
          calendarioApi.listar({ obra_id: obraId })
        ]);
        setObra(obraData);
        setEventos(eventosData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInfo();
  }, [obraId]);

  const prevMes = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  const nextMes = () => setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  const goHoy = () => setFechaActual(new Date());

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) return <div className="text-center py-20 text-text-muted">Cargando calendario...</div>;
  if (!obra) return <div className="text-center py-20 text-error">Obra no encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => router.back()} className="text-text-muted hover:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Calendario de Obra</h1>
          <p className="text-text-muted text-sm">{obra.nombre} ({obra.codigo})</p>
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
    </div>
  );
}
