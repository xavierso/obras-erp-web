import { apiClient, ApiException } from './apiClient';

export interface ResumenDashboard {
  obras_activas: number;
  visitas_hoy: number;
  visitas_semana: number;
  documentos_nuevos_semana: number;
  actividades_retrasadas_total: number;
  obras_avance: { id: number; nombre: string; progreso_porcentaje: number }[];
}

export const dashboardApi = {
  obtenerResumen: async (): Promise<ResumenDashboard> => {
    try {
      const response = await apiClient.get('/dashboard/resumen');
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
