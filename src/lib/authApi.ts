import { apiClient, ApiException } from './apiClient';

export type RolUsuario = 'ADMIN' | 'DIRECTOR' | 'INSPECTOR' | 'LECTOR';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export const isUserAdmin = (user: Usuario | null) => user?.rol?.toUpperCase() === 'ADMIN';
export const isUserDirector = (user: Usuario | null) => isUserAdmin(user) || user?.rol?.toUpperCase() === 'DIRECTOR';
export const isUserInspector = (user: Usuario | null) => isUserDirector(user) || user?.rol?.toUpperCase() === 'INSPECTOR';
export const isUserLector = (user: Usuario | null) => user?.rol?.toUpperCase() === 'LECTOR';

export const authApi = {
  registrar: async (email: string, nombre: string, password: string): Promise<void> => {
    try {
      await apiClient.post('/auth/register', { email, nombre, password });
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  login: async (email: string, password: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await apiClient.post('/auth/login', formData);
      return response.data.access_token;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  aceptarInvitacion: async (token: string, nombre: string, password: string): Promise<string> => {
    try {
      const response = await apiClient.post('/auth/aceptar-invitacion', {
        token,
        nombre,
        password,
      });
      return response.data.access_token;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  obtenerPerfilPropio: async (): Promise<Usuario> => {
    try {
      const response = await apiClient.get('/auth/me');
      return {
        id: response.data.id,
        email: response.data.email,
        nombre: response.data.nombre,
        rol: (response.data.rol as string)?.toUpperCase() as RolUsuario || 'ADMIN',
      };
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
