import { documentosApi, CategoriaDocumento } from './documentosApi';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  ApiException: {
    fromAxiosError: jest.fn((e) => new Error('API Error'))
  }
}));

global.FormData = class {
  append = jest.fn();
} as any;

describe('documentosApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listar() calls GET', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await documentosApi.listar(1);
    expect(apiClient.get).toHaveBeenCalledWith('/obras/1/documentos', { params: {} });
  });

  it('listarTodos() calls GET', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await documentosApi.listarTodos(CategoriaDocumento.planos);
    expect(apiClient.get).toHaveBeenCalledWith('/documentos', { params: { categoria: 'planos' } });
  });

  it('subir() calls POST with FormData', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });
    const dummyFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    await documentosApi.subir(1, CategoriaDocumento.facturas, dummyFile);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/obras/1/documentos',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  });
});
