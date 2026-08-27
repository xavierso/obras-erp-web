import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Tarea, TareaCreate, TareaUpdate, EstadoTarea, tareasApi } from '@/lib/tareasApi';
import { equipoApi, MiembroEquipoOut } from '@/lib/equipoApi';

interface FormTareaInlineProps {
  obraId: number;
  visitaId?: number;
  tareaSeleccionada?: Tarea | null;
  onClose: () => void;
  onSaved: () => void;
}

export function FormTareaInline({ obraId, visitaId, tareaSeleccionada, onClose, onSaved }: FormTareaInlineProps) {
  const [titulo, setTitulo] = useState(tareaSeleccionada?.titulo || '');
  const [descripcion, setDescripcion] = useState(tareaSeleccionada?.descripcion || '');
  const [fechaLimite, setFechaLimite] = useState(tareaSeleccionada?.fecha_limite || '');
  const [responsableId, setResponsableId] = useState<number | ''>(tareaSeleccionada?.responsable_id || '');
  const [estado, setEstado] = useState<EstadoTarea>(tareaSeleccionada?.estado || EstadoTarea.PENDIENTE);
  const [archivos, setArchivos] = useState<File[]>([]);
  
  const [miembros, setMiembros] = useState<MiembroEquipoOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMiembros, setLoadingMiembros] = useState(true);
  
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
    const fetchMiembros = async () => {
      try {
        const resumen = await equipoApi.obtenerResumen();
        setMiembros(resumen.miembros.filter(m => m.is_active));
      } catch (error) {
        console.error('Error al cargar miembros', error);
      } finally {
        setLoadingMiembros(false);
      }
    };
    fetchMiembros();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    
    setLoading(true);
    try {
      if (tareaSeleccionada) {
        const updateData: TareaUpdate = {
          titulo,
          descripcion: descripcion || null,
          fecha_limite: fechaLimite || null,
          responsable_id: responsableId === '' ? null : Number(responsableId),
          estado,
          archivos
        };
        await tareasApi.actualizar(tareaSeleccionada.id, updateData);
      } else {
        const createData: TareaCreate = {
          visita_id: visitaId || null,
          titulo,
          descripcion: descripcion || null,
          fecha_limite: fechaLimite || null,
          responsable_id: responsableId === '' ? null : Number(responsableId),
          estado,
          archivos
        };
        await tareasApi.crear(obraId, createData);
      }
      onSaved();
    } catch (error) {
      alert('Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-text-main">
          {tareaSeleccionada ? 'Editar Tarea' : 'Nueva Tarea'}
        </h4>
        <button onClick={onClose} className="text-text-muted hover:text-text-main">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Título *</label>
          <input 
            type="text" 
            required 
            value={titulo} 
            onChange={e => setTitulo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
            placeholder="Ej. Comprar materiales"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Descripción</label>
          <textarea 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent resize-none"
            placeholder="Detalles adicionales..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Responsable</label>
            <div className="relative">
              <select 
                value={responsableId} 
                onChange={e => setResponsableId(e.target.value === '' ? '' : e.target.value)}
                disabled={loadingMiembros}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-text-main focus:outline-none focus:border-accent appearance-none cursor-pointer"
              >
                <option value="" className="bg-bg-deep">Sin asignar</option>
                {miembros.map(m => (
                  <option key={m.id} value={m.id} className="bg-bg-deep">{m.nombre}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
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

        {tareaSeleccionada && (
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Estado</label>
            <div className="relative">
              <select 
                value={estado} 
                onChange={e => setEstado(e.target.value as EstadoTarea)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-text-main focus:outline-none focus:border-accent appearance-none cursor-pointer"
              >
                <option value={EstadoTarea.PENDIENTE} className="bg-bg-deep text-text-main">Pendiente</option>
                <option value={EstadoTarea.EN_PROGRESO} className="bg-bg-deep text-brand-blue">En Progreso</option>
                <option value={EstadoTarea.COMPLETADA} className="bg-bg-deep text-success">Completada</option>
                <option value={EstadoTarea.VENCIDA} className="bg-bg-deep text-error">Vencida</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

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
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="!py-1.5 !px-3 text-xs">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="!py-1.5 !px-3 text-xs">
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
