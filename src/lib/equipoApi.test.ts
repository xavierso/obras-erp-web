import { equipoApi } from './equipoApi';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  ApiException: {
    fromAxiosError: jest.fn((e) => new Error('API Error'))
  }
}));

describe('equipoApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('obtenerResumen() calls GET', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { miembros: [] } });
    const res = await equipoApi.obtenerResumen();
    expect(apiClient.get).toHaveBeenCalledWith('/equipo');
    expect(res.miembros).toEqual([]);
  });

  it('invitar() calls POST', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { token: '123' } });
    const token = await equipoApi.invitar('test@test.com', 'INSPECTOR');
    expect(apiClient.post).toHaveBeenCalledWith('/equipo/invitar', { email: 'test@test.com', rol: 'INSPECTOR' });
    expect(token).toBe('123');
  });

  it('darDeBaja() calls DELETE', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await equipoApi.darDeBaja(1);
    expect(apiClient.delete).toHaveBeenCalledWith('/equipo/1');
  });

  it('cancelarInvitacion() calls DELETE', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    await equipoApi.cancelarInvitacion(2);
    expect(apiClient.delete).toHaveBeenCalledWith('/equipo/invitaciones/2');
  });
});
