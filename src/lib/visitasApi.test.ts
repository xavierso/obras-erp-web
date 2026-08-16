import { visitasApi } from './visitasApi';
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

// Mock FormData
global.FormData = class {
  append = jest.fn();
} as any;

describe('visitasApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listar() calls GET /obras/:id/visitas', async () => {
    const mockData = [{ id: 1, descripcion: 'Visita 1' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const result = await visitasApi.listar(123);
    expect(apiClient.get).toHaveBeenCalledWith('/obras/123/visitas');
    expect(result).toEqual(mockData);
  });

  it('listarTodas() calls GET /visitas', async () => {
    const mockData = [{ id: 1, obra_nombre: 'Obra 1' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const result = await visitasApi.listarTodas(20);
    expect(apiClient.get).toHaveBeenCalledWith('/visitas', { params: { limite: 20 } });
    expect(result).toEqual(mockData);
  });

  it('crear() calls POST with FormData', async () => {
    const mockVisita = { id: 1, descripcion: 'Nueva' };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockVisita });
    
    // Create a dummy File (using Blob fallback for testing if File is not in env, 
    // but just cast an object here since we just test if it's passed)
    const dummyFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

    const result = await visitasApi.crear(123, 'Nueva visita', [dummyFile]);
    
    expect(apiClient.post).toHaveBeenCalledWith(
      '/obras/123/visitas',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
    expect(result).toEqual(mockVisita);
  });
});
