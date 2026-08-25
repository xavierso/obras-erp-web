import { apiClient, ApiException } from './apiClient';
import { RolUsuario } from './authApi';

export interface InvitacionOut {
  id: number;
  email: string;
  rol: RolUsuario;
  estado: string;
  created_at: string;
  expira_at: string;
}

export interface MiembroEquipoOut {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  is_active: boolean;
  created_at: string;
}

export interface ResumenEquipo {
  miembros: MiembroEquipoOut[];
  invitaciones_pendientes: InvitacionOut[];
}

export const equipoApi = {
  obtenerResumen: async (): Promise<ResumenEquipo> => {
    try {
      const response = await apiClient.get('/equipo');
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  invitar: async (email: string, rol: RolUsuario): Promise<string> => {
    try {
      const response = await apiClient.post('/equipo/invitar', { email, rol });
      return response.data.token;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  darDeBaja: async (usuarioId: number): Promise<void> => {
    try {
      await apiClient.delete(`/equipo/${usuarioId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  cancelarInvitacion: async (invitacionId: number): Promise<void> => {
    try {
      await apiClient.delete(`/equipo/invitaciones/${invitacionId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
