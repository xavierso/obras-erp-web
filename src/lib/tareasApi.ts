import { apiClient, ApiException } from './apiClient';
import { UsuarioOut } from './equipoApi';

export enum EstadoTarea {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  VENCIDA = 'VENCIDA',
}

export enum TipoArchivoTarea {
  FOTO = 'foto',
  VIDEO = 'video',
  DOCUMENTO = 'documento',
}

export interface TareaArchivo {
  id: number;
  tipo: TipoArchivoTarea;
  nombre_original: string;
  url: string;
}

export interface HistorialTarea {
  id: number;
  tarea_id: number;
  usuario_id: number;
  estado_anterior?: EstadoTarea;
  estado_nuevo: EstadoTarea;
  fecha: string;
  usuario: UsuarioOut;
}

export interface Tarea {
  id: number;
  obra_id: number;
  visita_id?: number;
  incidencia_id?: number;
  creador_id: number;
  responsable_id?: number;
  titulo: string;
  descripcion?: string;
  fecha_limite?: string;
  estado: EstadoTarea;
  created_at: string;
  updated_at: string;
  
  responsable?: UsuarioOut;
  creador: UsuarioOut;
  historial: HistorialTarea[];
  archivos: TareaArchivo[];
}

export interface TareaCreate {
  visita_id?: number | null;
  titulo: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
  responsable_id?: number | null;
  estado?: EstadoTarea;
  archivos?: File[];
}

export interface TareaUpdate {
  titulo?: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
  responsable_id?: number | null;
  estado?: EstadoTarea;
  archivos?: File[];
}

export const tareasApi = {
  listar: async (params?: { estado?: EstadoTarea; responsable_id?: number; limit?: number }): Promise<Tarea[]> => {
    try {
      const response = await apiClient.get('/tareas', { params });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  listarPorObra: async (obraId: number, params?: { visita_id?: number; estado?: EstadoTarea; responsable_id?: number }): Promise<Tarea[]> => {
    try {
      const response = await apiClient.get(`/obras/${obraId}/tareas`, { params });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  crear: async (obraId: number, data: TareaCreate): Promise<Tarea> => {
    try {
      const formData = new FormData();
      formData.append('titulo', data.titulo);
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      if (data.fecha_limite) formData.append('fecha_limite', data.fecha_limite);
      if (data.responsable_id) formData.append('responsable_id', data.responsable_id.toString());
      if (data.estado) formData.append('estado', data.estado);
      if (data.visita_id) formData.append('visita_id', data.visita_id.toString());
      
      if (data.archivos) {
        data.archivos.forEach(file => {
          formData.append('archivos', file);
        });
      }

      const response = await apiClient.post(`/obras/${obraId}/tareas`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  obtener: async (tareaId: number): Promise<Tarea> => {
    try {
      const response = await apiClient.get(`/tareas/${tareaId}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  actualizar: async (tareaId: number, data: TareaUpdate): Promise<Tarea> => {
    try {
      const formData = new FormData();
      if (data.titulo) formData.append('titulo', data.titulo);
      if (data.descripcion !== undefined) formData.append('descripcion', data.descripcion || '');
      if (data.fecha_limite !== undefined) formData.append('fecha_limite', data.fecha_limite || '');
      if (data.responsable_id !== undefined) formData.append('responsable_id', data.responsable_id?.toString() || '');
      if (data.estado) formData.append('estado', data.estado);
      
      if (data.archivos) {
        data.archivos.forEach(file => {
          formData.append('archivos', file);
        });
      }

      const response = await apiClient.patch(`/tareas/${tareaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  eliminar: async (tareaId: number): Promise<void> => {
    try {
      await apiClient.delete(`/tareas/${tareaId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },
};
