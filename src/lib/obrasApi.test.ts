import { obrasApi, EstadoObra } from './obrasApi';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  ApiException: {
    fromAxiosError: jest.fn((e) => new Error('API Error'))
  }
}));

describe('obrasApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listar() calls GET /obras', async () => {
    const mockData = [{ id: 1, nombre: 'Obra 1', estado: EstadoObra.pendiente }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const result = await obrasApi.listar();
    expect(apiClient.get).toHaveBeenCalledWith('/obras');
    expect(result).toEqual(mockData);
  });

  it('crear() calls POST /obras with correct data', async () => {
    const mockObra = { id: 2, nombre: 'Nueva Obra' };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockObra });

    const result = await obrasApi.crear('Nueva Obra', 'Cliente X');
    expect(apiClient.post).toHaveBeenCalledWith('/obras', {
      nombre: 'Nueva Obra',
      cliente: 'Cliente X'
    });
    expect(result).toEqual(mockObra);
  });

  it('cambiarEstado() calls PATCH /obras/:id/estado', async () => {
    const mockObra = { id: 1, estado: EstadoObra.enEjecucion };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: mockObra });

    const result = await obrasApi.cambiarEstado(1, EstadoObra.enEjecucion);
    expect(apiClient.patch).toHaveBeenCalledWith('/obras/1/estado', {
      estado: EstadoObra.enEjecucion
    });
    expect(result).toEqual(mockObra);
  });
});
