import { apiClient, ApiException } from './apiClient';

export interface NotificacionOut {
  id: number;
  tipo_evento: string;
  mensaje: string;
  created_at: string;
  leida: boolean;
}

export const notificacionesApi = {
  obtener: async (): Promise<NotificacionOut[]> => {
    try {
      const response = await apiClient.get('/notificaciones');
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  marcarLeida: async (id: number): Promise<void> => {
    try {
      await apiClient.post(`/notificaciones/${id}/leer`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
