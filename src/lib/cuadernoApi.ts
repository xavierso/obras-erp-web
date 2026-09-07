import { apiClient, ApiException } from './apiClient';

export type TipoNotaCuaderno = 'nota' | 'croquis' | 'visita' | 'tarea' | 'incidencia' | 'presupuesto' | 'certificacion' | 'pedido' | 'otro';

export interface NotaCuaderno {
  id: number;
  obra_id: number;
  autor_id: number;
  titulo?: string;
  tipo: TipoNotaCuaderno;
  preview_url?: string;
  entidad_relacionada_tipo?: string;
  entidad_relacionada_id?: number;
  created_at: string;
  updated_at: string;
  canvasData?: any;
}

export interface NotaCuadernoCreate {
  titulo?: string;
  tipo: TipoNotaCuaderno;
  entidad_relacionada_tipo?: string;
  entidad_relacionada_id?: number;
  canvas_data?: any;
}

export interface NotaCuadernoUpdate {
  titulo?: string;
  tipo?: TipoNotaCuaderno;
  preview_url?: string;
  entidad_relacionada_tipo?: string;
  entidad_relacionada_id?: number;
  canvas_data?: any;
}

export const cuadernoApi = {
  listar: async (obraId: number, tipo?: TipoNotaCuaderno): Promise<NotaCuaderno[]> => {
    try {
      const query = tipo ? `?tipo=${tipo}` : '';
      const response = await apiClient.get(`/obras/${obraId}/cuaderno${query}`);
      return response.data.map((n: any) => ({...n, canvasData: n.canvas_data}));
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  obtener: async (obraId: number, notaId: number): Promise<NotaCuaderno> => {
    try {
      const response = await apiClient.get(`/obras/${obraId}/cuaderno/${notaId}`);
      return { ...response.data, canvasData: response.data.canvas_data };
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  crear: async (obraId: number, data: NotaCuadernoCreate): Promise<NotaCuaderno> => {
    try {
      const response = await apiClient.post(`/obras/${obraId}/cuaderno`, data);
      return { ...response.data, canvasData: response.data.canvas_data };
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  actualizar: async (obraId: number, notaId: number, data: NotaCuadernoUpdate): Promise<NotaCuaderno> => {
    try {
      const response = await apiClient.put(`/obras/${obraId}/cuaderno/${notaId}`, data);
      return { ...response.data, canvasData: response.data.canvas_data };
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  eliminar: async (obraId: number, notaId: number): Promise<void> => {
    try {
      await apiClient.delete(`/obras/${obraId}/cuaderno/${notaId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },
};
