'use client';
import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PresupuestoResumen } from '@/lib/presupuestosApi';
import { Obra } from '@/lib/obrasApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardChartsProps {
  presupuestos: PresupuestoResumen[];
  obras: Obra[];
}

const COLORS = {
  ganado: '#F2C200', // Dorado DIAM
  pendiente: '#0F427E', // Azul marca
  perdido: '#E0796B', // Rojo suave
  
  obrasActivas: '#7FB88B', // Verde
  obrasPausadas: '#8A8975', // Gris/Muted
};

export default function DashboardCharts({ presupuestos, obras }: DashboardChartsProps) {
  
  // 1. Datos para Presupuestos: Pendientes vs Ganados
  const pieData = useMemo(() => {
    let ganados = 0;
    let pendientes = 0;
    let perdidos = 0;

    presupuestos.forEach(p => {
      if (['aprobado', 'en_ejecucion', 'finalizado'].includes(p.estado)) {
        ganados++;
      } else if (['borrador', 'enviado', 'pendiente_aprobacion'].includes(p.estado)) {
        pendientes++;
      } else if (['cancelado'].includes(p.estado)) {
        perdidos++;
      }
    });

    return [
      { name: 'Ganados / Aprob.', value: ganados, color: COLORS.ganado },
      { name: 'Pendientes', value: pendientes, color: COLORS.pendiente },
      { name: 'Cancelados', value: perdidos, color: COLORS.perdido },
    ];
  }, [presupuestos]);

  // 2. Datos para Volumen Económico del mes (Últimos 6 meses)
  const barData = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    
    // Generar últimos 6 meses en orden
    const last6Months = Array.from({length: 6}).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        monthKey: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`,
        name: `${meses[d.getMonth()]}`,
        volumen: 0
      };
    });

    // Sumar volumen
    presupuestos.forEach(p => {
      if (!p.fecha) return;
      if (['aprobado', 'en_ejecucion', 'finalizado'].includes(p.estado)) {
        const pDate = new Date(p.fecha);
        const key = `${pDate.getFullYear()}-${String(pDate.getMonth()+1).padStart(2, '0')}`;
        const target = last6Months.find(m => m.monthKey === key);
        if (target) {
          target.volumen += p.total || 0;
        }
      }
    });

    return last6Months;
  }, [presupuestos]);

  // 3. Obras Activas (Gráfico circular de estado de obras)
  const obrasData = useMemo(() => {
    let activas = 0;
    let pausadas = 0;
    let finalizadas = 0;

    obras.forEach(o => {
      if (['en_ejecucion'].includes(o.estado || '')) activas++;
      else if (['en_pausa'].includes(o.estado || '')) pausadas++;
      else if (['finalizada', 'entregada'].includes(o.estado || '')) finalizadas++;
    });

    return [
      { name: 'En Ejecución', value: activas, color: COLORS.obrasActivas },
      { name: 'En Pausa', value: pausadas, color: COLORS.obrasPausadas },
      { name: 'Finalizadas', value: finalizadas, color: COLORS.ganado },
    ];
  }, [obras]);

  const hasVolumen = barData.some(d => d.volumen > 0);
  const hasPieData = pieData.some(d => d.value > 0);
  const hasObrasData = obrasData.some(d => d.value > 0);

  return (
    <div className="flex flex-col gap-6 my-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasa de Éxito de Presupuestos */}
        <GlassCard padding="p-6" className="flex flex-col">
          <h3 className="text-lg font-semibold text-text-main mb-6">Tasa de Éxito de Presupuestos</h3>
          <div className="w-full h-[250px] relative">
            {!hasPieData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted opacity-50">
                <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-sm">No hay presupuestos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#081635', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Estado de Obras */}
        <GlassCard padding="p-6" className="flex flex-col">
          <h3 className="text-lg font-semibold text-text-main mb-6">Estado de Obras</h3>
          <div className="w-full h-[250px] relative">
            {!hasObrasData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted opacity-50">
                <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-sm">No hay obras registradas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={obrasData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {obrasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#081635', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Volumen Económico Mensual */}
      <GlassCard padding="p-6" className="flex flex-col">
        <h3 className="text-lg font-semibold text-text-main mb-6">Volumen Económico Generado</h3>
        <div className="w-full h-[250px] relative">
          {!hasVolumen ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted opacity-50 bg-white/5 rounded-xl border border-dashed border-white/10 m-2">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">No hay presupuestos aprobados</p>
              <p className="text-xs mt-1">Los ingresos aparecerán aquí al ganar proyectos</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#AFC1D6" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#AFC1D6" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `€${(val/1000)}k`}
                />
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${Number(value).toLocaleString('es-ES')} €`, 'Volumen']}
                  contentStyle={{ backgroundColor: '#081635', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar 
                  dataKey="volumen" 
                  fill={COLORS.ganado} 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

    </div>
  );
}
