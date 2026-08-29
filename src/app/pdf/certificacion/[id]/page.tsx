'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { certificacionesApi, Certificacion } from '@/lib/certificacionesApi';
import { presupuestosApi, Presupuesto, CapituloPresupuesto } from '@/lib/presupuestosApi';
import { perfilApi, PerfilEmpresa } from '@/lib/perfilApi';
import { getApiUrl } from '@/lib/apiClient';
import React from 'react';

export default function CertificacionPdfPage() {
  const params = useParams();
  const certId = parseInt(params.id as string, 10);
  const [certificacion, setCertificacion] = useState<Certificacion | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isNaN(certId)) {
      certificacionesApi.obtener(certId).then(async (cert) => {
        setCertificacion(cert);
        const [pptoData, perfilData] = await Promise.all([
          presupuestosApi.obtener(cert.presupuesto_id),
          perfilApi.obtener().catch(() => null)
        ]);
        setPresupuesto(pptoData);
        setPerfil(perfilData);
        setLoading(false);
        setTimeout(() => {
          window.print();
        }, 1000);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [certId]);

  if (loading) return <div className="p-10 text-center text-black">Generando PDF...</div>;
  if (!certificacion || !presupuesto) return <div className="p-10 text-center text-red-500">Error al cargar datos</div>;

  const getLogoUrl = () => {
    if (perfil?.logo_url) {
      if (perfil.logo_url.startsWith('http')) return perfil.logo_url;
      return `${getApiUrl(perfil.logo_url)}`;
    }
    return null;
  };

  const renderCapitulo = (capitulo: CapituloPresupuesto) => {
    const partidasCapitulo = capitulo.partidas || [];
    
    return (
      <React.Fragment key={`cap-${capitulo.id}`}>
        <tr className="bg-gray-100">
          <td colSpan={7} className="py-2 px-3 font-bold text-sm border-b border-gray-300">
            {capitulo.nombre}
          </td>
        </tr>
        
        {partidasCapitulo.map(partida => {
          const linea = certificacion.lineas.find(l => l.partida_id === partida.id);
          if (!linea || (linea.cantidad_actual === 0 && linea.cantidad_anterior === 0)) return null; 
          // Solo mostrar las que tienen movimiento para no ensuciar
          
          return (
            <tr key={`partida-${partida.id}`} className="border-b border-gray-200">
              <td className="py-1.5 px-3 text-xs w-[12%]">{linea.codigo_partida}</td>
              <td className="py-1.5 px-3 text-xs w-[38%]">{linea.descripcion_partida}</td>
              <td className="py-1.5 px-3 text-xs text-right w-[10%]">{linea.precio_unitario.toLocaleString('es-ES')} €</td>
              <td className="py-1.5 px-3 text-xs text-right w-[10%]">{linea.cantidad_presupuesto.toLocaleString('es-ES')}</td>
              <td className="py-1.5 px-3 text-xs text-right w-[10%]">{linea.cantidad_origen.toLocaleString('es-ES')}</td>
              <td className="py-1.5 px-3 text-xs text-right w-[10%] font-bold">{linea.cantidad_actual.toLocaleString('es-ES')}</td>
              <td className="py-1.5 px-3 text-xs text-right w-[10%] font-bold">{linea.importe_actual.toLocaleString('es-ES')} €</td>
            </tr>
          );
        })}
        
        {capitulo.subcapitulos?.map(subcap => renderCapitulo(subcap))}
      </React.Fragment>
    );
  };

  const ivaCalculado = certificacion.importe_actual * (presupuesto.iva / 100);
  const totalConIva = certificacion.importe_actual + ivaCalculado;

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-5xl mx-auto font-sans print:p-0 print:m-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 1cm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}} />
      
      {/* CABECERA (MEMBRETE) */}
      <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
        {/* LADO IZQUIERDO: LOGO Y DATOS */}
        <div className="flex flex-col">
          {perfil?.logo_url && (
            <img 
              src={getApiUrl(perfil.logo_url)} 
              alt="Logo" 
              className="w-48 h-auto object-contain object-left mb-1"
            />
          )}
          
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">
              {perfil?.nombre_empresa || 'EMPRESA'}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {perfil?.direccion || 'Dirección de la empresa'}
            </p>
            <p className="text-sm text-gray-600">
              {perfil?.cif ? `CIF: ${perfil.cif} | ` : 'CIF: B-12345678 | '}
              {perfil?.correo ? `${perfil.correo} | ` : 'info@empresa.com | '}
              {perfil?.telefono || '900 123 456'}
            </p>
          </div>
        </div>
        
        {/* LADO DERECHO: DATOS DE LA CERTIFICACIÓN */}
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-1 leading-none">CERTIFICACIÓN</h2>
          <p className="text-lg font-mono font-semibold text-gray-900">Nº {certificacion.numero}</p>
          <p className="text-sm text-gray-600 mt-2">Fecha: {new Date(certificacion.fecha).toLocaleDateString()}</p>
          <p className="text-sm text-gray-600">Ref: {presupuesto.codigo || `PTO-ID${presupuesto.id}`}</p>
        </div>
      </div>

      {/* BLOQUE DE INFORMACIÓN (CLIENTE / OBRA) */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Datos del Cliente</h3>
          <p className="font-semibold text-gray-900">{presupuesto.cliente_nombre || 'Cliente sin especificar'}</p>
          {presupuesto.direccion && <p className="text-sm text-gray-700 mt-1">{presupuesto.direccion}</p>}
          {presupuesto.codigo_postal && <p className="text-sm text-gray-700">{presupuesto.codigo_postal}</p>}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Datos de la Obra</h3>
          <p className="font-semibold text-gray-900">{presupuesto.nombre}</p>
        </div>
      </div>

      {/* TABLA DE CERTIFICACION */}
      <div className="mb-8">
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white text-xs">
              <th className="py-2 px-3 w-[12%]">CÓDIGO</th>
              <th className="py-2 px-3 w-[38%]">DESCRIPCIÓN</th>
              <th className="py-2 px-3 text-right w-[10%]">PRECIO</th>
              <th className="py-2 px-3 text-right w-[10%]">M. PPTO</th>
              <th className="py-2 px-3 text-right w-[10%]">A ORIGEN</th>
              <th className="py-2 px-3 text-right w-[10%]">M. ACTUAL</th>
              <th className="py-2 px-3 text-right w-[10%]">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            {presupuesto.capitulos.map(cap => renderCapitulo(cap))}
          </tbody>
        </table>
      </div>

      {/* TOTALES */}
      <div className="flex justify-end mb-10">
        <div className="w-1/3 bg-gray-50 border border-gray-300 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-600">Total Certificado:</span>
            <span>{certificacion.importe_actual.toLocaleString('es-ES')} €</span>
          </div>
          <div className="flex justify-between text-sm mb-2 border-b border-gray-200 pb-2">
            <span className="font-semibold text-gray-600">IVA ({presupuesto.iva}%):</span>
            <span>{ivaCalculado.toLocaleString('es-ES')} €</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-2">
            <span>TOTAL FACTURA:</span>
            <span>{totalConIva.toLocaleString('es-ES')} €</span>
          </div>
        </div>
      </div>

      {/* FIRMAS */}
      <div className="grid grid-cols-2 gap-16 mt-24">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 font-bold text-sm">POR LA EMPRESA CONSTRUCTORA</div>
          <div className="text-xs text-gray-500 mt-1">{perfil?.nombre_empresa || 'DIAM'}</div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 font-bold text-sm">EL CLIENTE / DIRECCIÓN FACULTATIVA</div>
          <div className="text-xs text-gray-500 mt-1">Recibí y conforme</div>
        </div>
      </div>

    </div>
  );
}
