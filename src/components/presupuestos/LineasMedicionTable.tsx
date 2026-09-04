import React, { useState, useEffect } from 'react';
import { presupuestosApi, LineaMedicion } from '@/lib/presupuestosApi';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LineasMedicionTableProps {
  partidaId: number;
  isBorrador: boolean;
  lineasIniciales: LineaMedicion[];
  onLineasChange: (newLineas: LineaMedicion[]) => void;
}

export function LineasMedicionTable({ partidaId, isBorrador, lineasIniciales, onLineasChange }: LineasMedicionTableProps) {
  const [lineas, setLineas] = useState<LineaMedicion[]>(lineasIniciales || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLineas(lineasIniciales || []);
  }, [lineasIniciales]);

  const recalcularSubtotal = (linea: Partial<LineaMedicion>) => {
    const u = linea.unidades || 0;
    const valoresMultiplicar = [linea.longitud, linea.anchura, linea.altura].filter(v => v !== undefined && v !== null && v !== 0) as number[];
    const prod = valoresMultiplicar.reduce((acc, val) => acc * val, 1);
    return u * (valoresMultiplicar.length > 0 ? prod : 1);
  };

  const handleAddLinea = async () => {
    try {
      setLoading(true);
      const nuevaLinea = await presupuestosApi.crearLineaMedicion(partidaId, {
        comentario: 'Nueva línea',
        unidades: 1,
        subtotal: 1
      });
      const updated = [...lineas, nuevaLinea];
      setLineas(updated);
      onLineasChange(updated);
    } catch (error) {
      console.error('Error al añadir línea:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLineaLocal = (index: number, field: keyof LineaMedicion, value: any) => {
    const updatedLineas = [...lineas];
    const linea = { ...updatedLineas[index] };
    
    // @ts-ignore
    linea[field] = value;
    
    if (['unidades', 'longitud', 'anchura', 'altura'].includes(field as string)) {
      linea.subtotal = recalcularSubtotal(linea);
    }
    
    updatedLineas[index] = linea;
    setLineas(updatedLineas);
    onLineasChange(updatedLineas);
  };

  const handleSaveLinea = async (index: number) => {
    const linea = lineas[index];
    if (!linea.id) return;
    try {
      await presupuestosApi.actualizarLineaMedicion(linea.id, {
        comentario: linea.comentario,
        unidades: linea.unidades,
        longitud: linea.longitud,
        anchura: linea.anchura,
        altura: linea.altura,
        subtotal: linea.subtotal
      });
    } catch (error) {
      console.error('Error al actualizar línea:', error);
    }
  };

  const handleDeleteLinea = async (index: number) => {
    const linea = lineas[index];
    if (!linea.id) return;
    try {
      setLoading(true);
      await presupuestosApi.borrarLineaMedicion(linea.id);
      const updated = lineas.filter((_, i) => i !== index);
      setLineas(updated);
      onLineasChange(updated);
    } catch (error) {
      console.error('Error al borrar línea:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-4 pt-4 border-t border-white/10">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-[10px] text-brand-blue uppercase tracking-wider font-semibold">Líneas de Medición</label>
        {isBorrador && (
          <Button variant="outlined" className="text-[10px] py-1 px-2 h-auto" onClick={handleAddLinea} disabled={loading}>
            <Plus className="w-3 h-3 mr-1" /> Añadir Línea
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-black/20 text-text-muted">
            <tr>
              <th className="p-2 font-semibold">Comentario</th>
              <th className="p-2 font-semibold text-right w-16">N (Uds)</th>
              <th className="p-2 font-semibold text-right w-16">Longitud</th>
              <th className="p-2 font-semibold text-right w-16">Anchura</th>
              <th className="p-2 font-semibold text-right w-16">Altura</th>
              <th className="p-2 font-semibold text-right w-20">Subtotal</th>
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea, index) => (
              <tr key={linea.id || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-1">
                  <input
                    type="text"
                    value={linea.comentario || ''}
                    onChange={(e) => handleUpdateLineaLocal(index, 'comentario', e.target.value)}
                    onBlur={() => handleSaveLinea(index)}
                    disabled={!isBorrador}
                    placeholder="Descripción..."
                    className="w-full bg-transparent text-text-main border-b border-transparent focus:border-brand-blue outline-none px-1"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    value={linea.unidades === 0 ? '' : linea.unidades}
                    onChange={(e) => handleUpdateLineaLocal(index, 'unidades', e.target.value === '' ? 0 : Number(e.target.value))}
                    onBlur={() => handleSaveLinea(index)}
                    disabled={!isBorrador}
                    className="w-full bg-transparent text-right border-b border-transparent focus:border-brand-blue outline-none px-1"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    value={linea.longitud || ''}
                    onChange={(e) => handleUpdateLineaLocal(index, 'longitud', e.target.value === '' ? null : Number(e.target.value))}
                    onBlur={() => handleSaveLinea(index)}
                    disabled={!isBorrador}
                    className="w-full bg-transparent text-right border-b border-transparent focus:border-brand-blue outline-none px-1"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    value={linea.anchura || ''}
                    onChange={(e) => handleUpdateLineaLocal(index, 'anchura', e.target.value === '' ? null : Number(e.target.value))}
                    onBlur={() => handleSaveLinea(index)}
                    disabled={!isBorrador}
                    className="w-full bg-transparent text-right border-b border-transparent focus:border-brand-blue outline-none px-1"
                  />
                </td>
                <td className="p-1">
                  <input
                    type="number"
                    value={linea.altura || ''}
                    onChange={(e) => handleUpdateLineaLocal(index, 'altura', e.target.value === '' ? null : Number(e.target.value))}
                    onBlur={() => handleSaveLinea(index)}
                    disabled={!isBorrador}
                    className="w-full bg-transparent text-right border-b border-transparent focus:border-brand-blue outline-none px-1"
                  />
                </td>
                <td className="p-1 text-right font-semibold text-brand-blue">
                  {linea.subtotal?.toLocaleString('es-ES', { maximumFractionDigits: 3 })}
                </td>
                <td className="p-1 text-center">
                  {isBorrador && (
                    <button onClick={() => handleDeleteLinea(index)} className="text-text-muted hover:text-error p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lineas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-text-muted text-xs bg-black/10">
                  No hay líneas de medición para esta partida.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
