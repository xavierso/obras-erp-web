'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { presupuestosApi, Presupuesto } from '@/lib/presupuestosApi';
import { perfilApi, PerfilEmpresa } from '@/lib/perfilApi';
import { getApiUrl } from '@/lib/apiClient';
import React from 'react';

export default function PresupuestoPdfPage() {
  const params = useParams();
  const presupuestoId = parseInt(params.id as string, 10);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isNaN(presupuestoId)) {
      Promise.all([
        presupuestosApi.obtener(presupuestoId),
        perfilApi.obtener().catch(() => null)
      ])
        .then(([presupuestoData, perfilData]) => {
          setPresupuesto(presupuestoData);
          setPerfil(perfilData);
          setLoading(false);
          // Permitir renderizado y lanzar print
          setTimeout(() => {
            window.print();
          }, 1000);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [presupuestoId]);

  if (loading) {
    return <div className="p-10 text-center">Generando PDF...</div>;
  }

  if (!presupuesto) {
    return <div className="p-10 text-center text-red-500">Error al cargar presupuesto</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-5xl mx-auto font-sans print:p-0 print:m-0">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 1cm; size: A4 portrait; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hide { display: none !important; }
          /* Forzar saltos de pagina donde queramos (opcional) */
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
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
        
        {/* LADO DERECHO: DATOS DEL PRESUPUESTO */}
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-1 leading-none">PRESUPUESTO</h2>
          <p className="text-lg font-mono font-semibold text-gray-900">{presupuesto.codigo || `PTO-ID${presupuesto.id}`}</p>
          <p className="text-sm text-gray-600 mt-2">Fecha: {new Date(presupuesto.fecha).toLocaleDateString()}</p>
          <p className="text-sm text-gray-600">Versión: v{presupuesto.version}</p>
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
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Datos del Proyecto</h3>
          <p className="font-semibold text-gray-900">{presupuesto.nombre}</p>
          {presupuesto.direccion && <p className="text-sm text-gray-700 mt-1">Lugar de Ejecución: {presupuesto.direccion}</p>}
          {presupuesto.codigo_postal && <p className="text-sm text-gray-700">{presupuesto.codigo_postal}</p>}
        </div>
      </div>

      {/* TABLA DE CAPITULOS Y PARTIDAS */}
      <div className="mb-10">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="py-2 px-3 font-semibold w-16">CÓDIGO</th>
              <th className="py-2 px-3 font-semibold">DESCRIPCIÓN</th>
              <th className="py-2 px-3 font-semibold text-center w-16">UDS</th>
              <th className="py-2 px-3 font-semibold text-right w-24">PRECIO</th>
              <th className="py-2 px-3 font-semibold text-right w-24">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {presupuesto.capitulos.map((cap, capIndex) => (
              <React.Fragment key={cap.id}>
                {/* CABECERA DE CAPÍTULO */}
                <tr className="bg-gray-200 font-bold border-b-2 border-white no-break">
                  <td className="py-3 px-3 text-gray-700">{(capIndex + 1).toString().padStart(2, '0')}</td>
                  <td className="py-3 px-3 text-gray-900 uppercase tracking-wide">{cap.nombre}</td>
                  <td colSpan={3}></td>
                </tr>

                {/* PARTIDAS DEL CAPÍTULO */}
                {cap.partidas?.map((partida) => (
                  <React.Fragment key={partida.id}>
                    <tr className="border-b border-gray-100 no-break">
                      <td className="py-3 px-3 text-gray-500 font-mono text-xs align-top">{partida.codigo}</td>
                      <td className="py-3 px-3 align-top">
                        <p className="font-semibold text-gray-800">{partida.descripcion}</p>
                        {partida.observaciones && (
                          <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{partida.observaciones}</p>
                        )}
                        {/* LINEAS DE MEDICION IN PDF */}
                        {partida.lineas_medicion && partida.lineas_medicion.length > 0 && (
                          <div className="mt-3 w-full bg-gray-50 p-2 rounded text-[10px]">
                            <div className="grid grid-cols-6 gap-2 mb-1 text-gray-500 font-semibold border-b border-gray-200 pb-1">
                              <div className="col-span-2">Comentario</div>
                              <div className="text-right">N (Uds)</div>
                              <div className="text-right">Long.</div>
                              <div className="text-right">Anch.</div>
                              <div className="text-right">Alt.</div>
                            </div>
                            {partida.lineas_medicion.map((linea, idx) => (
                              <div key={idx} className="grid grid-cols-6 gap-2 text-gray-600 py-0.5">
                                <div className="col-span-2 truncate">{linea.comentario || '-'}</div>
                                <div className="text-right">{linea.unidades ?? ''}</div>
                                <div className="text-right">{linea.longitud ?? ''}</div>
                                <div className="text-right">{linea.anchura ?? ''}</div>
                                <div className="text-right">{linea.altura ?? ''}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center align-top text-gray-700">
                        {partida.cantidad_calculada ?? partida.cantidad} <span className="text-[10px] text-gray-500">{partida.unidad}</span>
                      </td>
                      <td className="py-3 px-3 text-right align-top text-gray-700">
                        {partida.precio_unitario?.toLocaleString('es-ES', {minimumFractionDigits: 2})} €
                      </td>
                      <td className="py-3 px-3 text-right font-semibold align-top text-gray-900">
                        {partida.importe?.toLocaleString('es-ES', {minimumFractionDigits: 2})} €
                      </td>
                    </tr>
                  </React.Fragment>
                ))}

                {/* SUBTOTAL CAPÍTULO */}
                <tr className="bg-gray-50 font-bold text-gray-700 text-sm no-break">
                  <td colSpan={4} className="py-2 px-3 text-right uppercase text-xs tracking-wider">Subtotal {(capIndex + 1).toString().padStart(2, '0')}</td>
                  <td className="py-2 px-3 text-right border-t-2 border-gray-300">{cap.subtotal?.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
                </tr>
                {/* Espaciador */}
                <tr><td colSpan={5} className="py-2"></td></tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* RESUMEN FINANCIERO */}
      <div className="flex justify-end no-break">
        <div className="w-1/2 min-w-[300px]">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-3 font-medium text-gray-600">Base Imponible (Coste Directo)</td>
                <td className="py-3 text-right font-mono">{presupuesto.coste_directo.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-3 font-medium text-gray-600">I.V.A. ({presupuesto.iva}%)</td>
                <td className="py-3 text-right font-mono">{presupuesto.importe_iva.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
              </tr>
              <tr className="bg-gray-900 text-white text-lg font-bold">
                <td className="py-4 px-4 rounded-l-lg uppercase tracking-wider">Total Presupuesto</td>
                <td className="py-4 px-4 text-right rounded-r-lg">{presupuesto.total.toLocaleString('es-ES', {minimumFractionDigits: 2})} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FIRMAS Y CONDICIONES */}
      <div className="mt-24 grid grid-cols-2 gap-20 no-break">
        <div className="text-center">
          <div className="border-b border-gray-400 pb-16"></div>
          <p className="mt-2 text-sm font-semibold text-gray-800">Firma de {perfil?.nombre_empresa || 'EMPRESA'}</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 pb-16"></div>
          <p className="mt-2 text-sm font-semibold text-gray-800">Firma del Cliente (Aceptación)</p>
          <p className="text-xs text-gray-500 mt-1">D./Dña. {presupuesto.cliente_nombre}</p>
        </div>
      </div>

      <div className="mt-12 text-xs text-gray-500 text-center border-t border-gray-200 pt-4 print:fixed print:bottom-0 print:left-0 print:w-full print:bg-white">
        <p>Este presupuesto tiene una validez de 30 días naturales desde la fecha de su emisión.</p>
        <p>Los precios indicados pueden sufrir variaciones si las características técnicas del proyecto cambian durante la ejecución.</p>
      </div>

      {/* BOTON FLOTANTE PARA RE-IMPRIMIR O VOLVER (no sale en PDF) */}
      <div className="fixed top-4 right-4 flex gap-2 print-hide">
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 font-medium">Cerrar</button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-medium">Imprimir / PDF</button>
      </div>
    </div>
  );
}
