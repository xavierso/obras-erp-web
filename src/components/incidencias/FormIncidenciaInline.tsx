import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuth } from '@/context/AuthContext';
import { incidenciasApi, Incidencia, IncidenciaCreate, IncidenciaUpdate, EstadoIncidencia } from '@/lib/incidenciasApi';
import { equipoApi, MiembroEquipoOut } from '@/lib/equipoApi';
import { cronogramaApi, ActividadCronograma } from '@/lib/cronogramaApi';

interface FormIncidenciaInlineProps {
  obraId: number;
  visitaId?: number;
  incidenciaSeleccionada?: Incidencia | null;
  onClose: () => void;
  onSaved: () => void;
}

export function FormIncidenciaInline({ obraId, visitaId, incidenciaSeleccionada, onClose, onSaved }: FormIncidenciaInlineProps) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState(incidenciaSeleccionada?.titulo || '');
  const [descripcion, setDescripcion] = useState(incidenciaSeleccionada?.descripcion || '');
  const [observaciones, setObservaciones] = useState(incidenciaSeleccionada?.observaciones || '');
  const [fechaDeteccion, setFechaDeteccion] = useState(incidenciaSeleccionada?.fecha_deteccion || new Date().toISOString().split('T')[0]);
  const [fechaLimite, setFechaLimite] = useState(incidenciaSeleccionada?.fecha_limite || '');
  const [responsableId, setResponsableId] = useState<number | ''>(incidenciaSeleccionada?.responsable_id || '');
  const [actividadId, setActividadId] = useState<number | ''>(incidenciaSeleccionada?.actividad_id || '');
  const [estado, setEstado] = useState<EstadoIncidencia>(incidenciaSeleccionada?.estado || EstadoIncidencia.NUEVA);
  const [archivos, setArchivos] = useState<File[]>([]);
  
  const [miembros, setMiembros] = useState<MiembroEquipoOut[]>([]);
  const [actividades, setActividades] = useState<ActividadCronograma[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumen, crono] = await Promise.all([
          equipoApi.obtenerResumen(),
          cronogramaApi.listarPorObra(obraId)
        ]);
        setMiembros(resumen.miembros.filter(m => m.is_active));
        setActividades(crono);
      } catch (error) {
        console.error("Error cargando datos", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [obraId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    
    setLoading(true);
    try {
      if (incidenciaSeleccionada) {
        const updateData: IncidenciaUpdate = {
          titulo,
          descripcion: descripcion || null,
          observaciones: observaciones || null,
          fecha_deteccion: fechaDeteccion,
          fecha_limite: fechaLimite || null,
          responsable_id: responsableId === '' ? null : Number(responsableId),
          actividad_id: actividadId === '' ? null : Number(actividadId),
          estado,
          archivos
        };
        await incidenciasApi.actualizar(incidenciaSeleccionada.id, updateData);
      } else {
        const createData: IncidenciaCreate = {
          visita_id: visitaId || null,
          titulo,
          descripcion: descripcion || null,
          observaciones: observaciones || null,
          fecha_deteccion: fechaDeteccion,
          fecha_limite: fechaLimite || null,
          responsable_id: responsableId === '' ? null : Number(responsableId),
          actividad_id: actividadId === '' ? null : Number(actividadId),
          estado,
          archivos
        };
        await incidenciasApi.crear(obraId, createData);
      }
      onSaved();
    } catch (error) {
      console.error("Error guardando incidencia", error);
      alert("Hubo un error al guardar la incidencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4 mt-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input 
            type="text" 
            placeholder="Título de la incidencia *" 
            value={titulo} 
            onChange={e => setTitulo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
            required
          />
        </div>
        
        <div>
          <textarea 
            placeholder="Descripción de la incidencia (opcional)" 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent min-h-[60px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Fecha de Detección *</label>
            <input 
              type="date" 
              value={fechaDeteccion} 
              onChange={e => setFechaDeteccion(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent [color-scheme:dark]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Fecha Límite</label>
            <input 
              type="date" 
              value={fechaLimite} 
              onChange={e => setFechaLimite(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Responsable</label>
            <div className="relative z-30">
              <Dropdown
                value={responsableId.toString()}
                onChange={(val) => setResponsableId(val === '' ? '' : Number(val))}
                disabled={loadingData}
                placeholder="Sin asignar"
                fullWidth
                options={[
                  { value: '', label: 'Sin asignar' },
                  ...miembros.map(m => ({ value: m.id.toString(), label: m.nombre }))
                ]}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Actividad de Cronograma</label>
            <div className="relative z-20">
              <Dropdown
                value={actividadId.toString()}
                onChange={(val) => setActividadId(val === '' ? '' : Number(val))}
                disabled={loadingData}
                placeholder="Sin vincular"
                fullWidth
                options={[
                  { value: '', label: 'Ninguna' },
                  ...actividades.map(a => ({ value: a.id.toString(), label: `${a.es_hito ? '◆' : '▪'} ${a.nombre}` }))
                ]}
              />
            </div>
          </div>
        </div>

        {incidenciaSeleccionada && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Estado</label>
              <div className="relative z-20">
                <Dropdown
                  value={estado}
                  onChange={(val) => setEstado(val as EstadoIncidencia)}
                  fullWidth
                  options={[
                    { value: EstadoIncidencia.NUEVA, label: 'Nueva' },
                    { value: EstadoIncidencia.EN_PROCESO, label: 'En Proceso' },
                    { value: EstadoIncidencia.RESUELTA, label: 'Resuelta' },
                    { value: EstadoIncidencia.CERRADA, label: 'Cerrada' }
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <textarea 
            placeholder="Observaciones adicionales (opcional)" 
            value={observaciones} 
            onChange={e => setObservaciones(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent min-h-[60px]"
          />
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-text-muted">Fotografías y Documentos</label>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <Button type="button" variant="outlined" className="!py-1 !px-2 text-[10px]" onClick={() => fileInputRef.current?.click()}>
              + Agregar Archivos
            </Button>
          </div>
          
          {archivos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {archivos.map((file, i) => (
                <div key={i} className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-1 text-xs">
                  <span className="truncate max-w-[120px] text-text-main mr-2">{file.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-error hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outlined" onClick={onClose} disabled={loading} className="!py-1.5 !px-3 text-xs">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="!py-1.5 !px-3 text-xs">
            {loading ? 'Guardando...' : (incidenciaSeleccionada ? 'Actualizar' : 'Crear Incidencia')}
          </Button>
        </div>
      </form>
    </div>
  );
}
