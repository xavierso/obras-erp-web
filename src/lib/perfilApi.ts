import { apiClient, ApiException } from './apiClient';

export interface PerfilEmpresa {
  id: number;
  nombre_empresa: string;
  logo_url: string | null;
  color_principal: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  cif: string | null;
}

export const perfilApi = {
  obtener: async (): Promise<PerfilEmpresa | null> => {
    try {
      const response = await apiClient.get('/perfil');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw ApiException.fromAxiosError(error);
    }
  },

  actualizar: async (
    nombreEmpresa: string, 
    colorPrincipal: string, 
    direccion: string,
    telefono: string,
    correo: string,
    cif: string,
    logo?: File
  ): Promise<PerfilEmpresa> => {
    try {
      const formData = new FormData();
      formData.append('nombre_empresa', nombreEmpresa);
      formData.append('color_principal', colorPrincipal);
      formData.append('direccion', direccion);
      formData.append('telefono', telefono);
      formData.append('correo', correo);
      formData.append('cif', cif);
      
      if (logo) {
        formData.append('logo', logo);
      }

      const response = await apiClient.put('/perfil', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
