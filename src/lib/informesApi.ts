import { apiClient, ApiException } from './apiClient';

export interface InformeParams {
  visita_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export const informesApi = {
  generar: async (obraId: number, params: InformeParams = {}): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/obras/${obraId}/informe`, {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },
  descargarBlob: (blob: Blob, nombreArchivo: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
