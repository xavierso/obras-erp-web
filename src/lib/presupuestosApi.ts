import { apiClient } from './apiClient';

export type EstadoPresupuesto = 'borrador' | 'enviado' | 'pendiente_aprobacion' | 'aprobado' | 'en_ejecucion' | 'finalizado' | 'cancelado';

export interface PartidaPresupuesto {
  id: number;
  capitulo_id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  coste_base?: number;
  coste_material?: number;
  porcentaje_indirectos?: number;
  porcentaje_comisiones?: number;
  coste_unitario: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  margen_porcentaje: number;
  importe: number;
  coste_total: number;
  observaciones?: string;
}

export interface CapituloPresupuesto {
  id: number;
  presupuesto_id: number;
  padre_id?: number | null;
  nombre: string;
  orden: number;
  subtotal: number;
  partidas: PartidaPresupuesto[];
  subcapitulos: CapituloPresupuesto[];
}

export interface Presupuesto {
  id: number;
  obra_id: number | null;
  nombre: string;
  descripcion?: string;
  fecha: string;
  version: number;
  observaciones?: string;
  iva: number;
  codigo?: string;
  cliente_nombre?: string;
  direccion?: string;
  codigo_postal?: string;
  estado: EstadoPresupuesto;
  es_version_activa: boolean;
  coste_estimado_obra?: number;
  coste_directo: number;
  importe_iva: number;
  total: number;
  capitulos: CapituloPresupuesto[];
  created_at: string;
}

export interface PresupuestoResumen {
  id: number;
  obra_id: number | null;
  codigo?: string;
  nombre: string;
  version: number;
  fecha: string;
  estado: EstadoPresupuesto;
  es_version_activa: boolean;
  coste_directo: number;
  importe_iva: number;
  total: number;
}

export const estadoPresupuestoLabels: Record<EstadoPresupuesto, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado al Cliente',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  en_ejecucion: 'En ejecución',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado (Descartado)'
};

export const presupuestosApi = {
  listarTodos: async (): Promise<PresupuestoResumen[]> => {
    const response = await apiClient.get('/presupuestos/');
    return response.data;
  },

  listarPorObra: async (obraId: number): Promise<PresupuestoResumen[]> => {
    const response = await apiClient.get(`/presupuestos/obra/${obraId}`);
    return response.data;
  },
  
  obtener: async (id: number): Promise<Presupuesto> => {
    const response = await apiClient.get(`/presupuestos/${id}`);
    return response.data;
  },

  crear: async (data: Partial<Presupuesto>): Promise<Presupuesto> => {
    const response = await apiClient.post('/presupuestos/', data);
    return response.data;
  },

  actualizar: async (id: number, data: Partial<Presupuesto>): Promise<Presupuesto> => {
    const response = await apiClient.put(`/presupuestos/${id}`, data);
    return response.data;
  },
  
  aprobar: async (id: number, data?: { obra_nombre?: string, obra_direccion?: string }): Promise<Presupuesto> => {
    const response = await apiClient.post(`/presupuestos/${id}/aprobar`, data || {});
    return response.data;
  },

  cambiarEstado: async (id: number, estado: EstadoPresupuesto): Promise<Presupuesto> => {
    const response = await apiClient.put(`/presupuestos/${id}/estado`, { estado });
    return response.data;
  },

  generarCronograma: async (id: number, partidasIds: number[]): Promise<{message: string}> => {
    const response = await apiClient.post(`/presupuestos/${id}/generar-cronograma`, {
      partidas: partidasIds.map(pid => ({ partida_id: pid }))
    });
    return response.data;
  },

  // Edición interactiva
  crearCapitulo: async (presupuestoId: number, data: any): Promise<CapituloPresupuesto> => {
    const response = await apiClient.post(`/presupuestos/${presupuestoId}/capitulos`, data);
    return response.data;
  },

  crearPartida: async (capituloId: number, data: any): Promise<PartidaPresupuesto> => {
    const response = await apiClient.post(`/presupuestos/capitulos/${capituloId}/partidas`, data);
    return response.data;
  },

  actualizarPartida: async (partidaId: number, data: any): Promise<PartidaPresupuesto> => {
    const response = await apiClient.put(`/presupuestos/partidas/${partidaId}`, data);
    return response.data;
  },

  borrarCapitulo: async (capituloId: number): Promise<{message: string}> => {
    const response = await apiClient.delete(`/presupuestos/capitulos/${capituloId}`);
    return response.data;
  },

  borrarPartida: async (partidaId: number): Promise<{message: string}> => {
    const response = await apiClient.delete(`/presupuestos/partidas/${partidaId}`);
    return response.data;
  }
};
