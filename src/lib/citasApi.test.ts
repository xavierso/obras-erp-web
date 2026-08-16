import { citasApi, EstadoCita } from './citasApi';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  ApiException: {
    fromAxiosError: jest.fn((e) => new Error('API Error'))
  }
}));

describe('citasApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listar() calls GET /citas', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    await citasApi.listar({ estado: EstadoCita.pendiente });
    expect(apiClient.get).toHaveBeenCalledWith('/citas', { params: { estado: 'pendiente' } });
  });

  it('crear() calls POST /citas', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });
    await citasApi.crear({
      fecha_hora: '2026-08-16T10:00:00.000Z',
      nombre_referencia: 'Test'
    });
    expect(apiClient.post).toHaveBeenCalledWith('/citas', {
      fecha_hora: '2026-08-16T10:00:00.000Z',
      nombre_referencia: 'Test'
    });
  });

  it('obtener() calls GET /citas/:id', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });
    await citasApi.obtener(1);
    expect(apiClient.get).toHaveBeenCalledWith('/citas/1');
  });

  it('reprogramar() calls PATCH /citas/:id', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });
    await citasApi.reprogramar(1, { notas: 'test' });
    expect(apiClient.patch).toHaveBeenCalledWith('/citas/1', { notas: 'test' });
  });

  it('cambiarEstado() calls PATCH /citas/:id/estado', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });
    await citasApi.cambiarEstado(1, EstadoCita.completada);
    expect(apiClient.patch).toHaveBeenCalledWith('/citas/1/estado', { estado: 'completada' });
  });

  it('eliminar() calls DELETE /citas/:id', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await citasApi.eliminar(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/citas/1');
  });
});
