import { dashboardApi } from './dashboardApi';
import { apiClient } from './apiClient';

jest.mock('./apiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
  ApiException: {
    fromAxiosError: jest.fn((e) => new Error('API Error'))
  }
}));

describe('dashboardApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('obtenerResumen() calls GET', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { obras_activas: 5 } });
    const res = await dashboardApi.obtenerResumen();
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/resumen');
    expect(res.obras_activas).toBe(5);
  });
});
