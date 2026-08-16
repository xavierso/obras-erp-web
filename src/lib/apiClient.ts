import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const getApiUrl = (path: string) => `${API_URL}${path}`;

export class ApiException extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
  }

  static fromAxiosError(error: unknown) {
    const err = error as any;
    if (err.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') {
        return new ApiException(detail, error.response.status);
      }
      if (Array.isArray(detail) && detail.length > 0 && typeof detail[0] === 'object') {
        const firstError = detail[0];
        const loc = firstError.loc ? firstError.loc[firstError.loc.length - 1] : '';
        return new ApiException(`${loc}: ${firstError.msg || 'Dato inválido'}`, error.response.status);
      }
    }
    if (error.code === 'ECONNABORTED' || !error.response) {
      return new ApiException('No se pudo conectar con el servidor. Revisa que la API esté corriendo y que la URL configurada sea correcta.');
    }
    return new ApiException('Ocurrió un error inesperado. Inténtalo de nuevo.');
  }
}
