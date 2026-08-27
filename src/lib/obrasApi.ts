import { apiClient, ApiException } from './apiClient';

export enum EstadoObra {
  pendiente = 'pendiente',
  enEjecucion = 'en_ejecucion',
  enPausa = 'en_pausa',
  finalizada = 'finalizada',
  entregada = 'entregada',
  archivada = 'archivada'
}

export const estadoObraLabels: Record<EstadoObra, string> = {
  [EstadoObra.pendiente]: 'Pendiente',
  [EstadoObra.enEjecucion]: 'En ejecución',
  [EstadoObra.enPausa]: 'En pausa',
  [EstadoObra.finalizada]: 'Finalizada',
  [EstadoObra.entregada]: 'Entregada',
  [EstadoObra.archivada]: 'Archivada',
};

export interface Obra {
  id: number;
  codigo: string;
  nombre: string;
  cliente?: string;
  direccion?: string;
  estado: EstadoObra;
  fecha_inicio?: string;
  superficie_m2?: number;
  progreso_porcentaje?: number;
  estado_actual_texto?: string;
  total_visitas: number;
  ultima_visita_fecha?: string;
}

export const obrasApi = {
  listar: async (): Promise<Obra[]> => {
    try {
      const response = await apiClient.get('/obras');
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  obtener: async (id: number): Promise<Obra> => {
    try {
      const response = await apiClient.get(`/obras/${id}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  crear: async (nombre: string, cliente?: string, direccion?: string): Promise<Obra> => {
    try {
      const response = await apiClient.post('/obras', {
        nombre,
        ...(cliente ? { cliente } : {}),
        ...(direccion ? { direccion } : {})
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  cambiarEstado: async (obraId: number, nuevoEstado: EstadoObra): Promise<Obra> => {
    try {
      const response = await apiClient.patch(`/obras/${obraId}/estado`, {
        estado: nuevoEstado
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  eliminar: async (obraId: number): Promise<void> => {
    try {
      await apiClient.delete(`/obras/${obraId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
