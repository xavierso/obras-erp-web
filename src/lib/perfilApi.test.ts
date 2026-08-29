import { perfilApi } from './perfilApi';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
  ApiException: {
    fromAxiosError: jest.fn((e) => new Error('API Error'))
  }
}));

global.FormData = class {
  append = jest.fn();
} as any;

describe('perfilApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('obtener() calls GET', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { nombre_empresa: 'Test' } });
    const res = await perfilApi.obtener();
    expect(apiClient.get).toHaveBeenCalledWith('/perfil');
    expect(res?.nombre_empresa).toBe('Test');
  });

  it('actualizar() calls PUT with FormData', async () => {
    (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: {} });
    await perfilApi.actualizar('Test', '#fff', 'dir', 'tel', 'email', 'cif');
    expect(apiClient.put).toHaveBeenCalledWith('/perfil', expect.any(FormData), expect.any(Object));
  });
});
