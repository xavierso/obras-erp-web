import { apiClient } from './apiClient';

export type EstadoCertificacion = 'borrador' | 'emitida' | 'facturada' | 'cobrada' | 'anulada';

export const estadoCertificacionLabels: Record<EstadoCertificacion, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  facturada: 'Facturada',
  cobrada: 'Cobrada',
  anulada: 'Anulada'
};

export interface LineaCertificacion {
  id: number;
  certificacion_id: number;
  partida_id: number;
  cantidad_actual: number;
  
  codigo_partida: string;
  descripcion_partida: string;
  unidad_partida: string;
  precio_unitario: number;
  cantidad_presupuesto: number;
  cantidad_anterior: number;
  cantidad_origen: number;
  porcentaje_avance: number;
  importe_actual: number;
  importe_origen: number;
}

export interface Certificacion {
  id: number;
  presupuesto_id: number;
  numero: number;
  fecha: string;
  estado: EstadoCertificacion;
  observaciones?: string;
  
  importe_actual: number;
  importe_origen: number;
  presupuesto_total: number;
  porcentaje_avance_total: number;

  lineas: LineaCertificacion[];
}

export interface CertificacionResumen {
  id: number;
  presupuesto_id: number;
  numero: number;
  fecha: string;
  estado: EstadoCertificacion;
  observaciones?: string;
  importe_actual: number;
  porcentaje_avance_total: number;
}

export const certificacionesApi = {
  listarPorPresupuesto: async (presupuestoId: number): Promise<CertificacionResumen[]> => {
    const response = await apiClient.get(`/presupuestos/${presupuestoId}/certificaciones`);
    return response.data;
  },

  obtener: async (id: number): Promise<Certificacion> => {
    const response = await apiClient.get(`/certificaciones/${id}`);
    return response.data;
  },

  crear: async (presupuestoId: number, data: { fecha: string, observaciones?: string }): Promise<Certificacion> => {
    const response = await apiClient.post(`/presupuestos/${presupuestoId}/certificaciones`, data);
    return response.data;
  },

  guardarLineas: async (id: number, lineas: { partida_id: number, cantidad_actual: number }[]): Promise<Certificacion> => {
    const response = await apiClient.put(`/certificaciones/${id}/lineas`, lineas);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: EstadoCertificacion): Promise<Certificacion> => {
    const response = await apiClient.put(`/certificaciones/${id}/estado`, { estado });
    return response.data;
  }
};
