import { apiClient } from './apiClient';

export interface LineaMedicionIntermedia {
  comentario?: string;
  unidades?: number;
  longitud?: number;
  anchura?: number;
  altura?: number;
  subtotal: number;
}

export interface PartidaIntermedia {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  importe: number;
  descuento_porcentaje: number;
  status: 'ok' | 'warning' | 'error';
  warnings: string[];
  fila_origen: number;
  observaciones?: string;
  lineas_medicion?: LineaMedicionIntermedia[];
}

export interface CapituloIntermedio {
  codigo: string;
  nombre: string;
  orden: number;
  partidas: PartidaIntermedia[];
  subcapitulos: CapituloIntermedio[];
}

export interface MetadatosPresupuesto {
  nombre_obra: string | null;
  cliente: string | null;
  direccion: string | null;
  fecha: string | null;
  codigo_presupuesto: string | null;
  observaciones: string | null;
  iva: number;
}

export interface ColumnMapping {
  codigo: number | null;
  descripcion: number | null;
  unidad: number | null;
  cantidad: number | null;
  precio_unitario: number | null;
  descuento: number | null;
  importe: number | null;
}

export interface ResultadoAnalisis {
  metadatos: MetadatosPresupuesto;
  capitulos: CapituloIntermedio[];
  column_mapping: ColumnMapping;
  total_capitulos: number;
  total_partidas: number;
  partidas_ok: number;
  partidas_warning: number;
  partidas_error: number;
  importe_total_detectado: number;
  warnings_globales: string[];
  columnas_excel: string[];
}

export const importacionApi = {
  analizar: async (file: File): Promise<ResultadoAnalisis> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/importar/presupuesto/analizar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data;
  },

  confirmar: async (data: any): Promise<any> => {
    const res = await apiClient.post('/importar/presupuesto/confirmar', data);
    return res.data;
  },
};
