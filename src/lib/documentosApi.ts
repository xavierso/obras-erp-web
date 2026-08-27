import { apiClient, ApiException } from './apiClient';

export enum CategoriaDocumento {
  planos = 'planos',
  presupuestos = 'presupuestos',
  contratos = 'contratos',
  facturas = 'facturas',
  garantias = 'garantias',
  tecnica = 'tecnica'
}

export const categoriaDocumentoLabels: Record<CategoriaDocumento, string> = {
  [CategoriaDocumento.planos]: 'Planos',
  [CategoriaDocumento.presupuestos]: 'Presupuestos',
  [CategoriaDocumento.contratos]: 'Contratos',
  [CategoriaDocumento.facturas]: 'Facturas',
  [CategoriaDocumento.garantias]: 'Garantías',
  [CategoriaDocumento.tecnica]: 'Técnica',
};

export interface Documento {
  id: number;
  obra_id: number;
  categoria: CategoriaDocumento;
  nombre_original: string;
  url: string;
  created_at: string;
}

export interface DocumentoConObra extends Documento {
  obra_nombre: string;
  obra_codigo: string;
}

export const documentosApi = {
  listar: async (obraId: number, categoria?: CategoriaDocumento): Promise<Documento[]> => {
    try {
      const response = await apiClient.get(`/obras/${obraId}/documentos`, {
        params: categoria ? { categoria } : {}
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  listarTodos: async (categoria?: CategoriaDocumento): Promise<DocumentoConObra[]> => {
    try {
      const response = await apiClient.get('/documentos', {
        params: categoria ? { categoria } : {}
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  subir: async (obraId: number, categoria: CategoriaDocumento, archivo: File): Promise<Documento> => {
    try {
      const formData = new FormData();
      formData.append('categoria', categoria);
      formData.append('archivo', archivo);

      const response = await apiClient.post(`/obras/${obraId}/documentos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  },

  eliminar: async (documentoId: number): Promise<void> => {
    try {
      await apiClient.delete(`/documentos/${documentoId}`);
    } catch (error) {
      throw ApiException.fromAxiosError(error);
    }
  }
};
