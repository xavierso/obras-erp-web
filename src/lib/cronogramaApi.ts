import { apiClient } from './apiClient';

export type EstadoActividad = 'no_iniciada' | 'en_ejecucion' | 'completada' | 'retrasada' | 'cancelada';

export interface ActividadCronograma {
  id: number;
  nombre: string;
  obra_id: number;
  fecha_inicio: string;
  fecha_fin_prevista: string;
  fecha_fin_real: string | null;
  porcentaje_avance: number;
  estado_base: EstadoActividad;
  estado: EstadoActividad;
  responsable_id: number | null;
  prioridad: string | null;
  observaciones: string | null;
  es_hito: boolean;
  predecesoras_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface ActividadCronogramaCreate {
  nombre: string;
  obra_id: number;
  fecha_inicio: string;
  fecha_fin_prevista: string;
  porcentaje_avance?: number;
  estado_base?: EstadoActividad;
  es_hito?: boolean;
  predecesoras_ids?: number[];
}

export interface ActividadCronogramaUpdate {
  nombre?: string;
  fecha_inicio?: string;
  fecha_fin_prevista?: string;
  fecha_fin_real?: string | null;
  porcentaje_avance?: number;
  estado_base?: EstadoActividad;
  responsable_id?: number | null;
  es_hito?: boolean;
  predecesoras_ids?: number[];
}

export const cronogramaApi = {
  listarPorObra: async (obraId: number): Promise<ActividadCronograma[]> => {
    const res = await apiClient.get(`/cronograma/obra/${obraId}`);
    return res.data;
  },

  crear: async (data: ActividadCronogramaCreate): Promise<ActividadCronograma> => {
    const res = await apiClient.post('/cronograma/', data);
    return res.data;
  },

  actualizar: async (id: number, data: ActividadCronogramaUpdate): Promise<ActividadCronograma> => {
    const res = await apiClient.put(`/cronograma/${id}`, data);
    return res.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await apiClient.delete(`/cronograma/${id}`);
  },
};
