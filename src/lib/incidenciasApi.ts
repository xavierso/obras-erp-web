import { apiClient, ApiException } from './apiClient';
import { MiembroEquipoOut } from './equipoApi';

export enum EstadoIncidencia {
  NUEVA = 'NUEVA',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTA = 'RESUELTA',
  CERRADA = 'CERRADA',
}

export enum TipoArchivoIncidencia {
  FOTO = 'foto',
  VIDEO = 'video',
  DOCUMENTO = 'documento',
}

export interface IncidenciaArchivo {
  id: number;
  tipo: TipoArchivoIncidencia;
  nombre_original: string;
  url: string;
}

export interface HistorialIncidencia {
  id: number;
  estado_anterior?: EstadoIncidencia;
  estado_nuevo: EstadoIncidencia;
  fecha: string;
  usuario: MiembroEquipoOut;
}

export interface Incidencia {
  id: number;
  codigo: string;
  obra_id: number;
  visita_id?: number;
  actividad_id?: number;
  creador_id: number;
  responsable_id?: number;
  titulo: string;
  descripcion?: string;
  observaciones?: string;
  fecha_deteccion: string;
  fecha_limite?: string;
  fecha_resolucion?: string;
  estado: EstadoIncidencia;
  created_at: string;
  updated_at: string;
  
  responsable?: MiembroEquipoOut;
  creador: MiembroEquipoOut;
  historial: HistorialIncidencia[];
  archivos: IncidenciaArchivo[];
  tareas: any[];
}

export interface IncidenciaCreate {
  visita_id?: number | null;
  actividad_id?: number | null;
  titulo: string;
  descripcion?: string | null;
  observaciones?: string | null;
  fecha_deteccion: string;
  fecha_limite?: string | null;
  responsable_id?: number | null;
  estado?: EstadoIncidencia;
  archivos?: File[];
}

export interface IncidenciaUpdate {
  titulo?: string;
  descripcion?: string | null;
  observaciones?: string | null;
  fecha_deteccion?: string;
  fecha_limite?: string | null;
  responsable_id?: number | null;
  actividad_id?: number | null;
  estado?: EstadoIncidencia;
  archivos?: File[];
}

export const incidenciasApi = {
  listar: async (params?: { estado?: EstadoIncidencia; responsable_id?: number; limit?: number }): Promise<Incidencia[]> => {
    try {
      const response = await apiClient.get('/incidencias', { params });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  listarPorObra: async (obraId: number, params?: { visita_id?: number; estado?: EstadoIncidencia; responsable_id?: number }): Promise<Incidencia[]> => {
    try {
      const response = await apiClient.get(`/obras/${obraId}/incidencias`, { params });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  obtener: async (incidenciaId: number): Promise<Incidencia> => {
    try {
      const response = await apiClient.get(`/incidencias/${incidenciaId}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  crear: async (obraId: number, data: IncidenciaCreate): Promise<Incidencia> => {
    try {
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      formData.append('fecha_deteccion', data.fecha_deteccion);
      
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      if (data.observaciones) formData.append('observaciones', data.observaciones);
      if (data.fecha_limite) formData.append('fecha_limite', data.fecha_limite);
      if (data.responsable_id) formData.append('responsable_id', data.responsable_id.toString());
      if (data.estado) formData.append('estado', data.estado);
      if (data.visita_id) formData.append('visita_id', data.visita_id.toString());
      
      if (data.archivos) {
        data.archivos.forEach(file => {
          formData.append('archivos', file);
        });
      }

      const response = await apiClient.post(`/obras/${obraId}/incidencias`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  actualizar: async (incidenciaId: number, data: IncidenciaUpdate): Promise<Incidencia> => {
    try {
      const formData = new FormData();
      if (data.titulo) formData.append('titulo', data.titulo);
      if (data.descripcion !== undefined) formData.append('descripcion', data.descripcion || '');
      if (data.observaciones !== undefined) formData.append('observaciones', data.observaciones || '');
      if (data.fecha_deteccion) formData.append('fecha_deteccion', data.fecha_deteccion);
      if (data.fecha_limite !== undefined) formData.append('fecha_limite', data.fecha_limite || '');
      if (data.responsable_id !== undefined) formData.append('responsable_id', data.responsable_id?.toString() || '');
      if (data.estado) formData.append('estado', data.estado);
      
      if (data.archivos) {
        data.archivos.forEach(file => {
          formData.append('archivos', file);
        });
      }

      const response = await apiClient.patch(`/incidencias/${incidenciaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  eliminar: async (incidenciaId: number): Promise<void> => {
    try {
      await apiClient.delete(`/incidencias/${incidenciaId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },
};
