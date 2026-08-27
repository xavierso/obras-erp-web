import { apiClient, ApiException } from './apiClient';

export enum TipoArchivoVisita {
  foto = 'foto',
  video = 'video'
}

export interface VisitaArchivo {
  id: number;
  tipo: TipoArchivoVisita;
  nombre_original: string;
  url: string;
}

export interface Visita {
  id: number;
  obra_id: number;
  descripcion?: string;
  fecha: string;
  archivos: VisitaArchivo[];
}

export interface VisitaConObra extends Visita {
  obra_nombre: string;
  obra_codigo: string;
}

export const visitasApi = {
  listar: async (obraId: number): Promise<Visita[]> => {
    try {
      const response = await apiClient.get(`/obras/${obraId}/visitas`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  obtener: async (obraId: number, visitaId: number): Promise<Visita> => {
    try {
      const response = await apiClient.get(`/obras/${obraId}/visitas/${visitaId}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  listarTodas: async (limite: number = 50): Promise<VisitaConObra[]> => {
    try {
      const response = await apiClient.get('/visitas', {
        params: { limite }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  crear: async (obraId: number, descripcion?: string, archivos: File[] = []): Promise<Visita> => {
    try {
      const formData = new FormData();
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }
      archivos.forEach((file) => {
        formData.append('archivos', file);
      });

      const response = await apiClient.post(`/obras/${obraId}/visitas`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  actualizar: async (obraId: number, visitaId: number, descripcion?: string, archivos: File[] = []): Promise<Visita> => {
    try {
      const formData = new FormData();
      if (descripcion !== undefined) {
        formData.append('descripcion', descripcion);
      }
      archivos.forEach((file) => {
        formData.append('archivos', file);
      });

      const response = await apiClient.put(`/obras/${obraId}/visitas/${visitaId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  eliminar: async (obraId: number, visitaId: number): Promise<void> => {
    try {
      await apiClient.delete(`/obras/${obraId}/visitas/${visitaId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
