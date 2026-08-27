import { apiClient } from './apiClient';

export interface EventoCalendarioOut {
  id: string;
  tipo: 'visita' | 'tarea' | 'incidencia' | 'hito' | 'reunion' | 'entrega' | 'otro';
  titulo: string;
  descripcion?: string;
  obra_id?: number;
  obra_nombre?: string;
  responsable_id?: number;
  responsable_nombre?: string;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado?: string;
}

export interface EventoCustomCreate {
  tipo: 'hito' | 'reunion' | 'entrega' | 'otro';
  titulo: string;
  descripcion?: string;
  obra_id?: number;
  responsable_id?: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio?: string; // HH:MM:SS
  hora_fin?: string; // HH:MM:SS
}

export const calendarioApi = {
  listar: async (params?: {
    obra_id?: number;
    responsable_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    tipos?: string[];
  }): Promise<EventoCalendarioOut[]> => {
    const res = await apiClient.get<EventoCalendarioOut[]>('/calendario/eventos', { params });
    return res.data;
  },

  crear: async (evento: EventoCustomCreate) => {
    const res = await apiClient.post('/calendario/eventos', evento);
    return res.data;
  },
};
