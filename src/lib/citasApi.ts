import { apiClient, ApiException } from './apiClient';

export enum EstadoCita {
  pendiente = 'pendiente',
  completada = 'completada',
  cancelada = 'cancelada'
}

export const estadoCitaLabels: Record<EstadoCita, string> = {
  [EstadoCita.pendiente]: 'Pendiente',
  [EstadoCita.completada]: 'Completada',
  [EstadoCita.cancelada]: 'Cancelada'
};

export interface CitaVisita {
  id: number;
  obra_id?: number | null;
  nombre_referencia?: string | null;
  fecha_hora: string;
  notas?: string | null;
  estado: EstadoCita;
  recordatorio_minutos_antes?: number | null;
  recordatorio_enviado: boolean;
  created_at: string;
}

export interface CitaVisitaCreate {
  obra_id?: number | null;
  nombre_referencia?: string | null;
  fecha_hora: string;
  notas?: string | null;
  recordatorio_minutos_antes?: number | null;
}

export interface CitaVisitaUpdate {
  fecha_hora?: string | null;
  notas?: string | null;
  recordatorio_minutos_antes?: number | null;
}

export const citasApi = {
  listar: async (params?: { 
    estado?: EstadoCita; 
    desde?: string; 
    hasta?: string; 
    obra_id?: number 
  }): Promise<CitaVisita[]> => {
    try {
      const response = await apiClient.get('/citas', { params });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  obtener: async (id: number): Promise<CitaVisita> => {
    try {
      const response = await apiClient.get(`/citas/${id}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  crear: async (datos: CitaVisitaCreate): Promise<CitaVisita> => {
    try {
      const response = await apiClient.post('/citas', datos);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  reprogramar: async (id: number, datos: CitaVisitaUpdate): Promise<CitaVisita> => {
    try {
      const response = await apiClient.patch(`/citas/${id}`, datos);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  cambiarEstado: async (id: number, estado: EstadoCita): Promise<CitaVisita> => {
    try {
      const response = await apiClient.patch(`/citas/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  eliminar: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/citas/${id}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
